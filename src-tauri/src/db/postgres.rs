use std::sync::Arc;
use tokio::sync::RwLock;
use tokio_postgres::{Client, Error as PgError, NoTls};
use tracing::{error, info};

use super::config::PgConfig;
use super::schema::{
    ChangeType, DryRunChange, DryRunResult, ForeignKeyInfo, TableInfo, TableStats,
};

/// Connect with SSL
async fn connect_ssl(conn_str: &str) -> Result<Client, String> {
    let tls_connector = native_tls::TlsConnector::builder()
        .danger_accept_invalid_certs(true) // For development/self-signed certs
        .build()
        .map_err(|e| format!("TLS connector error: {}", e))?;

    let connector = postgres_native_tls::MakeTlsConnector::new(tls_connector);

    let (client, connection) = tokio_postgres::connect(conn_str, connector)
        .await
        .map_err(|e| format!("SSL connection error: {}", e))?;

    // Spawn connection handler
    tokio::spawn(async move {
        if let Err(e) = connection.await {
            error!("PostgreSQL SSL connection error: {}", e);
        }
    });

    Ok(client)
}

/// Connection state
#[derive(Debug, Clone, PartialEq)]
pub enum ConnectionState {
    Disconnected,
    Connecting,
    Connected,
    Reconnecting { attempt: u32 },
    Error { message: String },
}

/// PostgreSQL connection manager
pub struct PostgresConnection {
    config: Option<PgConfig>,
    client: Option<Client>,
    state: ConnectionState,
}

impl PostgresConnection {
    pub fn new() -> Self {
        Self {
            config: None,
            client: None,
            state: ConnectionState::Disconnected,
        }
    }

    pub fn state(&self) -> &ConnectionState {
        &self.state
    }

    pub fn is_connected(&self) -> bool {
        matches!(self.state, ConnectionState::Connected)
    }

    /// Get a reference to the client (for use in watcher)
    pub fn get_client(&self) -> Option<&Client> {
        self.client.as_ref()
    }

    /// Connect to PostgreSQL
    pub async fn connect(&mut self, config: PgConfig) -> Result<(), String> {
        self.state = ConnectionState::Connecting;
        info!(
            "Connecting to PostgreSQL at {}:{} (SSL: {})",
            config.host, config.port, config.use_ssl
        );

        let conn_str = config.connection_string();

        if config.use_ssl {
            match connect_ssl(&conn_str).await {
                Ok(client) => {
                    self.config = Some(config);
                    self.client = Some(client);
                    self.state = ConnectionState::Connected;
                    info!("Connected to PostgreSQL with SSL successfully");
                    Ok(())
                }
                Err(e) => {
                    self.state = ConnectionState::Error { message: e.clone() };
                    error!("Failed to connect to PostgreSQL with SSL: {}", e);
                    Err(e)
                }
            }
        } else {
            match tokio_postgres::connect(&conn_str, NoTls).await {
                Ok((client, connection)) => {
                    // Spawn connection handler
                    tokio::spawn(async move {
                        if let Err(e) = connection.await {
                            error!("PostgreSQL connection error: {}", e);
                        }
                    });

                    self.config = Some(config);
                    self.client = Some(client);
                    self.state = ConnectionState::Connected;
                    info!("Connected to PostgreSQL successfully");
                    Ok(())
                }
                Err(e) => {
                    let msg = e.to_string();
                    self.state = ConnectionState::Error {
                        message: msg.clone(),
                    };
                    error!("Failed to connect to PostgreSQL: {}", e);
                    Err(msg)
                }
            }
        }
    }

    /// Disconnect from PostgreSQL
    pub async fn disconnect(&mut self) {
        self.client = None;
        self.config = None;
        self.state = ConnectionState::Disconnected;
        info!("Disconnected from PostgreSQL");
    }

    /// Test connection without maintaining it
    pub async fn test_connection(config: &PgConfig) -> Result<(), String> {
        let conn_str = config.connection_string();

        let client = if config.use_ssl {
            connect_ssl(&conn_str).await?
        } else {
            let (client, connection) = tokio_postgres::connect(&conn_str, NoTls)
                .await
                .map_err(|e| e.to_string())?;

            // Spawn connection and immediately drop to test
            tokio::spawn(async move {
                let _ = connection.await;
            });

            client
        };

        // Simple query to verify connection
        client
            .simple_query("SELECT 1")
            .await
            .map_err(|e| e.to_string())?;

        Ok(())
    }

    /// Get list of tables in the database
    pub async fn get_tables(&self) -> Result<Vec<TableInfo>, PgError> {
        let client = self
            .client
            .as_ref()
            .ok_or_else(|| std::io::Error::new(std::io::ErrorKind::NotConnected, "Not connected"))
            .map_err(|_| {
                // Convert to a postgres error - this is a workaround
                tokio_postgres::Error::__private_api_timeout()
            })?;

        let rows = client
            .query(
                r#"
            SELECT
                t.table_schema,
                t.table_name,
                COALESCE(
                    (SELECT COUNT(*) FROM information_schema.columns c
                     WHERE c.table_schema = t.table_schema
                     AND c.table_name = t.table_name),
                    0
                ) as column_count,
                COALESCE(obj_description(
                    (quote_ident(t.table_schema) || '.' || quote_ident(t.table_name))::regclass
                ), '') as table_comment
            FROM information_schema.tables t
            WHERE t.table_schema NOT IN ('pg_catalog', 'information_schema')
            AND t.table_type = 'BASE TABLE'
            ORDER BY t.table_schema, t.table_name
            "#,
                &[],
            )
            .await?;

        let tables = rows
            .iter()
            .map(|row| TableInfo {
                schema: row.get("table_schema"),
                name: row.get("table_name"),
                column_count: row.get::<_, i64>("column_count") as u32,
                comment: row.get("table_comment"),
            })
            .collect();

        Ok(tables)
    }

    /// Get column information for a specific table
    pub async fn get_columns(&self, schema: &str, table: &str) -> Result<Vec<ColumnInfo>, PgError> {
        let client = self
            .client
            .as_ref()
            .ok_or_else(|| std::io::Error::new(std::io::ErrorKind::NotConnected, "Not connected"))
            .map_err(|_| tokio_postgres::Error::__private_api_timeout())?;

        let rows = client
            .query(
                r#"
            SELECT
                c.column_name,
                c.data_type,
                c.is_nullable,
                c.column_default,
                c.ordinal_position,
                CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END as is_primary_key
            FROM information_schema.columns c
            LEFT JOIN (
                SELECT kcu.column_name
                FROM information_schema.table_constraints tc
                JOIN information_schema.key_column_usage kcu
                    ON tc.constraint_name = kcu.constraint_name
                    AND tc.table_schema = kcu.table_schema
                WHERE tc.constraint_type = 'PRIMARY KEY'
                AND tc.table_schema = $1
                AND tc.table_name = $2
            ) pk ON c.column_name = pk.column_name
            WHERE c.table_schema = $1 AND c.table_name = $2
            ORDER BY c.ordinal_position
            "#,
                &[&schema, &table],
            )
            .await?;

        let columns = rows
            .iter()
            .map(|row| ColumnInfo {
                name: row.get("column_name"),
                data_type: row.get("data_type"),
                is_nullable: row.get::<_, String>("is_nullable") == "YES",
                default_value: row.get("column_default"),
                is_primary_key: row.get("is_primary_key"),
            })
            .collect();

        Ok(columns)
    }

    /// Get current row count for a table
    pub async fn get_row_count(&self, schema: &str, table: &str) -> Result<i64, PgError> {
        let client = self
            .client
            .as_ref()
            .ok_or_else(|| std::io::Error::new(std::io::ErrorKind::NotConnected, "Not connected"))
            .map_err(|_| tokio_postgres::Error::__private_api_timeout())?;

        let query = format!(
            "SELECT COUNT(*) as count FROM {}.{}",
            quote_identifier(schema),
            quote_identifier(table)
        );

        let row = client.query_one(&query, &[]).await?;
        Ok(row.get("count"))
    }

    /// Get rows from a table with limit
    pub async fn get_rows(
        &self,
        schema: &str,
        table: &str,
        limit: i64,
        offset: i64,
    ) -> Result<Vec<serde_json::Value>, PgError> {
        let client = self
            .client
            .as_ref()
            .ok_or_else(|| std::io::Error::new(std::io::ErrorKind::NotConnected, "Not connected"))
            .map_err(|_| tokio_postgres::Error::__private_api_timeout())?;

        let query = format!(
            "SELECT row_to_json(t.*) as row_data FROM {}.{} t LIMIT $1 OFFSET $2",
            quote_identifier(schema),
            quote_identifier(table)
        );

        let rows = client.query(&query, &[&limit, &offset]).await?;

        let result: Vec<serde_json::Value> = rows.iter().map(|row| row.get("row_data")).collect();

        Ok(result)
    }

    /// Get foreign key relationships for all tables
    pub async fn get_foreign_keys(&self) -> Result<Vec<ForeignKeyInfo>, PgError> {
        let client = self
            .client
            .as_ref()
            .ok_or_else(|| std::io::Error::new(std::io::ErrorKind::NotConnected, "Not connected"))
            .map_err(|_| tokio_postgres::Error::__private_api_timeout())?;

        let rows = client
            .query(
                r#"
                SELECT
                    tc.constraint_name,
                    tc.table_schema as from_schema,
                    tc.table_name as from_table,
                    kcu.column_name as from_column,
                    ccu.table_schema as to_schema,
                    ccu.table_name as to_table,
                    ccu.column_name as to_column,
                    rc.delete_rule as on_delete,
                    rc.update_rule as on_update
                FROM information_schema.table_constraints tc
                JOIN information_schema.key_column_usage kcu
                    ON tc.constraint_name = kcu.constraint_name
                    AND tc.table_schema = kcu.table_schema
                JOIN information_schema.constraint_column_usage ccu
                    ON tc.constraint_name = ccu.constraint_name
                    AND tc.table_schema = ccu.table_schema
                JOIN information_schema.referential_constraints rc
                    ON tc.constraint_name = rc.constraint_name
                    AND tc.table_schema = rc.constraint_schema
                WHERE tc.constraint_type = 'FOREIGN KEY'
                ORDER BY tc.table_schema, tc.table_name, tc.constraint_name
                "#,
                &[],
            )
            .await?;

        let foreign_keys = rows
            .iter()
            .map(|row| ForeignKeyInfo {
                constraint_name: row.get("constraint_name"),
                from_schema: row.get("from_schema"),
                from_table: row.get("from_table"),
                from_column: row.get("from_column"),
                to_schema: row.get("to_schema"),
                to_table: row.get("to_table"),
                to_column: row.get("to_column"),
                on_delete: row.get("on_delete"),
                on_update: row.get("on_update"),
            })
            .collect();

        Ok(foreign_keys)
    }

    /// Get table statistics from pg_stat_user_tables (lightweight change detection)
    pub async fn get_table_stats(&self) -> Result<Vec<TableStats>, PgError> {
        let client = self
            .client
            .as_ref()
            .ok_or_else(|| std::io::Error::new(std::io::ErrorKind::NotConnected, "Not connected"))
            .map_err(|_| tokio_postgres::Error::__private_api_timeout())?;

        let rows = client
            .query(
                r#"
                SELECT
                    schemaname::text as schema,
                    relname::text as table_name,
                    COALESCE(n_tup_ins, 0) as n_tup_ins,
                    COALESCE(n_tup_upd, 0) as n_tup_upd,
                    COALESCE(n_tup_del, 0) as n_tup_del,
                    last_vacuum::text,
                    last_autovacuum::text
                FROM pg_stat_user_tables
                WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
                ORDER BY schemaname, relname
                "#,
                &[],
            )
            .await?;

        let stats = rows
            .iter()
            .map(|row| TableStats {
                schema: row.get("schema"),
                table: row.get("table_name"),
                n_tup_ins: row.get("n_tup_ins"),
                n_tup_upd: row.get("n_tup_upd"),
                n_tup_del: row.get("n_tup_del"),
                last_vacuum: row.get("last_vacuum"),
                last_autovacuum: row.get("last_autovacuum"),
            })
            .collect();

        Ok(stats)
    }

    /// Execute SQL in dry run mode (BEGIN -> execute -> capture changes -> ROLLBACK)
    pub async fn dry_run(&self, sql: &str) -> Result<DryRunResult, String> {
        let client = self
            .client
            .as_ref()
            .ok_or_else(|| "Not connected".to_string())?;

        // Safety check: reject SQL containing transaction control statements
        let sql_upper = sql.to_uppercase();
        if sql_upper.contains("COMMIT") || sql_upper.contains("BEGIN") || sql_upper.contains("ROLLBACK") {
            return Ok(DryRunResult {
                success: false,
                changes: vec![],
                error: Some("SQL cannot contain COMMIT, BEGIN, or ROLLBACK statements in dry run mode".to_string()),
                rows_affected: 0,
            });
        }

        info!("Dry run: Starting transaction");

        // Start transaction
        client
            .execute("BEGIN", &[])
            .await
            .map_err(|e| e.to_string())?;

        // Get list of tables to monitor
        let tables: Vec<(String, String)> = client
            .query(
                "SELECT schemaname::text, tablename::text FROM pg_tables WHERE schemaname NOT IN ('pg_catalog', 'information_schema')",
                &[],
            )
            .await
            .map_err(|e| e.to_string())?
            .iter()
            .map(|row| (row.get(0), row.get(1)))
            .collect();

        // Capture before state (row counts and data snapshots for small tables)
        let mut before_counts: std::collections::HashMap<String, i64> =
            std::collections::HashMap::new();
        // Store both raw string (for comparison) and parsed JSON (for display)
        let mut before_snapshots: std::collections::HashMap<
            String,
            Vec<(String, serde_json::Value)>,
        > = std::collections::HashMap::new();

        for (schema, table) in &tables {
            let count_result = client
                .query_one(
                    &format!("SELECT COUNT(*) as cnt FROM \"{}\".\"{}\"", schema, table),
                    &[],
                )
                .await;
            if let Ok(row) = count_result {
                let count: i64 = row.get("cnt");
                let full_name = format!("{}.{}", schema, table);
                before_counts.insert(full_name.clone(), count);

                // For small tables (< 1000 rows), capture snapshot for DELETE detection
                if count > 0 && count < 1000 {
                    let snapshot_result = client
                        .query(
                            &format!("SELECT row_to_json(t.*)::text as raw, row_to_json(t.*) as data FROM \"{}\".\"{}\" t", schema, table),
                            &[],
                        )
                        .await;
                    if let Ok(rows) = snapshot_result {
                        let snapshot: Vec<(String, serde_json::Value)> = rows
                            .iter()
                            .map(|r| {
                                let raw: String = r.get("raw");
                                let data: serde_json::Value = r.get("data");
                                (raw, data)
                            })
                            .collect();
                        before_snapshots.insert(full_name, snapshot);
                    }
                }
            }
        }

        // Execute the SQL
        let exec_result = client.batch_execute(sql).await;

        let mut changes: Vec<DryRunChange> = Vec::new();
        let mut rows_affected: i64 = 0;
        let mut error_msg: Option<String> = None;

        match exec_result {
            Ok(_) => {
                // Capture after state and detect changes
                for (schema, table) in &tables {
                    let full_name = format!("{}.{}", schema, table);
                    let before_count = before_counts.get(&full_name).copied().unwrap_or(0);

                    let count_result = client
                        .query_one(
                            &format!("SELECT COUNT(*) as cnt FROM \"{}\".\"{}\"", schema, table),
                            &[],
                        )
                        .await;

                    if let Ok(row) = count_result {
                        let after_count: i64 = row.get("cnt");
                        let diff = after_count - before_count;

                        if diff > 0 {
                            // INSERTs detected - get the new rows using row_to_json
                            let new_rows = client
                                .query(
                                    &format!(
                                        "SELECT row_to_json(t.*) as data FROM \"{}\".\"{}\" t ORDER BY ctid DESC LIMIT {}",
                                        schema, table, diff
                                    ),
                                    &[],
                                )
                                .await;

                            if let Ok(rows) = new_rows {
                                for row in rows {
                                    let data: serde_json::Value = row.get("data");
                                    changes.push(DryRunChange {
                                        schema: schema.clone(),
                                        table: table.clone(),
                                        change_type: ChangeType::Insert,
                                        before: None,
                                        after: Some(data),
                                    });
                                    rows_affected += 1;
                                }
                            }
                        } else if diff < 0 {
                            // DELETEs detected
                            let deleted_count = (-diff) as usize;

                            if let Some(before_snapshot) = before_snapshots.get(&full_name) {
                                // Get current rows as raw JSON strings for comparison
                                let after_rows_result = client
                                    .query(
                                        &format!("SELECT row_to_json(t.*)::text as data FROM \"{}\".\"{}\" t", schema, table),
                                        &[],
                                    )
                                    .await;

                                if let Ok(after_rows) = after_rows_result {
                                    // Build set of current row JSON strings
                                    let after_set: std::collections::HashSet<String> = after_rows
                                        .iter()
                                        .map(|r| {
                                            let data: String = r.get("data");
                                            data
                                        })
                                        .collect();

                                    // Find deleted rows (rows in before but not in after)
                                    let mut found_deletes = 0;
                                    for (raw_str, json_value) in before_snapshot {
                                        if found_deletes >= deleted_count {
                                            break;
                                        }
                                        // Compare using raw string from PostgreSQL
                                        if !after_set.contains(raw_str) {
                                            changes.push(DryRunChange {
                                                schema: schema.clone(),
                                                table: table.clone(),
                                                change_type: ChangeType::Delete,
                                                before: Some(json_value.clone()),
                                                after: None,
                                            });
                                            rows_affected += 1;
                                            found_deletes += 1;
                                        }
                                    }

                                    // If still need more, add without before data
                                    while found_deletes < deleted_count {
                                        changes.push(DryRunChange {
                                            schema: schema.clone(),
                                            table: table.clone(),
                                            change_type: ChangeType::Delete,
                                            before: None,
                                            after: None,
                                        });
                                        rows_affected += 1;
                                        found_deletes += 1;
                                    }
                                } else {
                                    // Query failed, report count only
                                    for _ in 0..deleted_count {
                                        changes.push(DryRunChange {
                                            schema: schema.clone(),
                                            table: table.clone(),
                                            change_type: ChangeType::Delete,
                                            before: None,
                                            after: None,
                                        });
                                        rows_affected += 1;
                                    }
                                }
                            } else {
                                // No snapshot, report count only
                                for _ in 0..deleted_count {
                                    changes.push(DryRunChange {
                                        schema: schema.clone(),
                                        table: table.clone(),
                                        change_type: ChangeType::Delete,
                                        before: None,
                                        after: None,
                                    });
                                    rows_affected += 1;
                                }
                            }
                        }
                    }
                }

                // Check for UPDATEs using xmin (transaction ID) - rows modified in this transaction
                for (schema, table) in &tables {
                    let full_name = format!("{}.{}", schema, table);
                    let before_count = before_counts.get(&full_name).copied().unwrap_or(0);
                    let after_count_result = client
                        .query_one(
                            &format!("SELECT COUNT(*) as cnt FROM \"{}\".\"{}\"", schema, table),
                            &[],
                        )
                        .await;
                    let after_count: i64 = after_count_result.map(|r| r.get("cnt")).unwrap_or(0);

                    // Only check for updates if row count didn't change
                    if before_count == after_count {
                        let updated_rows = client
                            .query(
                                &format!(
                                    "SELECT row_to_json(t.*) as data FROM \"{}\".\"{}\" t WHERE xmin = txid_current()::text::xid",
                                    schema, table
                                ),
                                &[],
                            )
                            .await;

                        if let Ok(rows) = updated_rows {
                            for row in rows {
                                let data: serde_json::Value = row.get("data");
                                changes.push(DryRunChange {
                                    schema: schema.clone(),
                                    table: table.clone(),
                                    change_type: ChangeType::Update,
                                    before: None,
                                    after: Some(data),
                                });
                                rows_affected += 1;
                            }
                        }
                    }
                }
            }
            Err(e) => {
                // Get detailed error message including PostgreSQL error details
                let mut msg = e.to_string();
                if let Some(db_err) = e.as_db_error() {
                    msg = format!(
                        "{}: {} (code: {}, detail: {:?})",
                        db_err.severity(),
                        db_err.message(),
                        db_err.code().code(),
                        db_err.detail()
                    );
                }
                error_msg = Some(msg);
            }
        }

        // Always rollback - this is critical for dry run safety
        match client.execute("ROLLBACK", &[]).await {
            Ok(_) => {
                info!("Dry run: Transaction rolled back successfully");
            }
            Err(e) => {
                error!("Dry run: ROLLBACK failed! {}", e);
                // If rollback failed, return error even if SQL succeeded
                return Ok(DryRunResult {
                    success: false,
                    changes: vec![],
                    error: Some(format!("CRITICAL: Rollback failed - {}", e)),
                    rows_affected: 0,
                });
            }
        }

        Ok(DryRunResult {
            success: error_msg.is_none(),
            changes,
            error: error_msg,
            rows_affected,
        })
    }
}

impl Default for PostgresConnection {
    fn default() -> Self {
        Self::new()
    }
}

/// Column information
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct ColumnInfo {
    pub name: String,
    pub data_type: String,
    pub is_nullable: bool,
    pub default_value: Option<String>,
    pub is_primary_key: bool,
}

/// Helper to properly quote SQL identifiers
fn quote_identifier(name: &str) -> String {
    format!("\"{}\"", name.replace('"', "\"\""))
}

/// Thread-safe connection wrapper
pub type SharedConnection = Arc<RwLock<PostgresConnection>>;

pub fn create_shared_connection() -> SharedConnection {
    Arc::new(RwLock::new(PostgresConnection::new()))
}
