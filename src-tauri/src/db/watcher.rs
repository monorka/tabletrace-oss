use std::collections::HashMap;
use std::sync::Arc;
use std::time::Duration;

use chrono::Utc;
use serde::{Deserialize, Serialize};
use tokio::sync::{mpsc, RwLock};
use tokio::time::interval;
use tracing::{debug, error, info, warn};
use uuid::Uuid;

use super::postgres::SharedConnection;
use super::schema::{ChangeType, TableChange};

/// Watcher configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WatcherConfig {
    /// Polling interval in milliseconds
    #[serde(default = "default_interval")]
    pub interval_ms: u64,
    /// Maximum rows to track per table
    #[serde(default = "default_max_rows")]
    pub max_rows_per_table: i64,
}

fn default_interval() -> u64 {
    1000 // 1 second
}

fn default_max_rows() -> i64 {
    10000
}

impl Default for WatcherConfig {
    fn default() -> Self {
        Self {
            interval_ms: default_interval(),
            max_rows_per_table: default_max_rows(),
        }
    }
}

/// Represents the state of a watched table
#[derive(Debug, Clone)]
struct TableState {
    schema: String,
    table: String,
    /// Primary key columns
    pk_columns: Vec<String>,
    /// Current snapshot: pk_value -> row_data
    rows: HashMap<String, serde_json::Value>,
    /// Row count for change detection
    row_count: i64,
}

/// Table watcher using polling
pub struct TableWatcher {
    connection: SharedConnection,
    config: WatcherConfig,
    /// Tables being watched: "schema.table" -> TableState
    watched_tables: Arc<RwLock<HashMap<String, TableState>>>,
    /// Flag to indicate if watching is active
    is_running: Arc<RwLock<bool>>,
    /// Sender for changes (shared across polling loop)
    change_tx: Arc<RwLock<Option<mpsc::Sender<TableChange>>>>,
}

impl TableWatcher {
    pub fn new(connection: SharedConnection, config: WatcherConfig) -> Self {
        Self {
            connection,
            config,
            watched_tables: Arc::new(RwLock::new(HashMap::new())),
            is_running: Arc::new(RwLock::new(false)),
            change_tx: Arc::new(RwLock::new(None)),
        }
    }

    /// Check if watcher is running
    pub async fn is_running(&self) -> bool {
        *self.is_running.read().await
    }

    /// Add a table to watch
    pub async fn add_table(&self, schema: &str, table: &str) -> Result<(), String> {
        let full_name = format!("{}.{}", schema, table);

        // Check if already watching
        {
            let watched = self.watched_tables.read().await;
            if watched.contains_key(&full_name) {
                info!("Already watching table: {}", full_name);
                return Ok(());
            }
        }

        // Get primary key columns
        let pk_columns = self.get_primary_key_columns(schema, table).await?;

        if pk_columns.is_empty() {
            return Err(format!(
                "Table {}.{} has no primary key. Cannot watch tables without primary key.",
                schema, table
            ));
        }

        // Get initial snapshot
        let (rows, row_count) = self
            .fetch_table_snapshot(schema, table, &pk_columns)
            .await?;

        let state = TableState {
            schema: schema.to_string(),
            table: table.to_string(),
            pk_columns,
            rows,
            row_count,
        };

        let mut watched = self.watched_tables.write().await;
        watched.insert(full_name.clone(), state);

        info!(
            "Started watching table: {} (total: {} tables)",
            full_name,
            watched.len()
        );
        Ok(())
    }

    /// Remove a table from watch list
    pub async fn remove_table(&self, schema: &str, table: &str) {
        let full_name = format!("{}.{}", schema, table);
        let mut watched = self.watched_tables.write().await;
        watched.remove(&full_name);
        info!("Stopped watching table: {}", full_name);
    }

    /// Get list of watched tables
    pub async fn get_watched_tables(&self) -> Vec<String> {
        let watched = self.watched_tables.read().await;
        watched.keys().cloned().collect()
    }

    /// Start the polling loop (only starts once)
    pub async fn start(&self) -> Option<mpsc::Receiver<TableChange>> {
        // Check if already running
        {
            let running = self.is_running.read().await;
            if *running {
                info!("Watcher already running, skipping start");
                return None;
            }
        }

        let (tx, rx) = mpsc::channel::<TableChange>(1000);

        // Store the sender
        {
            let mut tx_guard = self.change_tx.write().await;
            *tx_guard = Some(tx.clone());
        }

        // Mark as running
        {
            let mut is_running = self.is_running.write().await;
            *is_running = true;
        }

        let connection = self.connection.clone();
        let watched_tables = self.watched_tables.clone();
        let is_running = self.is_running.clone();
        let interval_ms = self.config.interval_ms;

        info!("Starting polling loop with {}ms interval", interval_ms);

        tokio::spawn(async move {
            let mut interval = interval(Duration::from_millis(interval_ms));

            loop {
                interval.tick().await;

                // Check if we should stop
                {
                    let running = is_running.read().await;
                    if !*running {
                        info!("Watcher stopped");
                        break;
                    }
                }

                // Check connection
                {
                    let conn = connection.read().await;
                    if !conn.is_connected() {
                        debug!("Not connected, skipping poll");
                        continue;
                    }
                }

                // Poll each table
                let tables: Vec<TableState> = {
                    let watched = watched_tables.read().await;
                    watched.values().cloned().collect()
                };

                if tables.is_empty() {
                    debug!("No tables to watch");
                    continue;
                }

                for table_state in tables {
                    if let Err(e) =
                        Self::poll_table(&connection, &watched_tables, &table_state, &tx).await
                    {
                        error!(
                            "Error polling table {}.{}: {}",
                            table_state.schema, table_state.table, e
                        );
                    }
                }
            }
        });

        Some(rx)
    }

    /// Stop the polling loop
    pub async fn stop(&self) {
        let mut is_running = self.is_running.write().await;
        *is_running = false;
        info!("Stopping watcher...");
    }

    /// Clear all watched tables and their snapshots
    pub async fn clear(&self) {
        let mut watched = self.watched_tables.write().await;
        watched.clear();
        info!("Cleared all watched table snapshots");
    }

    /// Poll a single table for changes
    async fn poll_table(
        connection: &SharedConnection,
        watched_tables: &Arc<RwLock<HashMap<String, TableState>>>,
        state: &TableState,
        tx: &mpsc::Sender<TableChange>,
    ) -> Result<(), String> {
        let conn = connection.read().await;

        // Fetch current data
        let pk_columns = &state.pk_columns;
        let (new_rows, new_count) =
            Self::fetch_snapshot_static(&conn, &state.schema, &state.table, pk_columns).await?;

        let old_rows = &state.rows;
        let mut changes = Vec::new();

        // Detect INSERTs and UPDATEs
        for (pk, new_row) in &new_rows {
            match old_rows.get(pk) {
                None => {
                    // INSERT: new row that didn't exist before
                    changes.push(TableChange {
                        id: Uuid::new_v4().to_string(),
                        schema: state.schema.clone(),
                        table: state.table.clone(),
                        change_type: ChangeType::Insert,
                        primary_key: Some(serde_json::json!({ "pk": pk })),
                        before: None,
                        after: Some(new_row.clone()),
                        timestamp: Utc::now().to_rfc3339(),
                        source: "polling".to_string(),
                    });
                }
                Some(old_row) => {
                    // Check if row changed (UPDATE)
                    if old_row != new_row {
                        changes.push(TableChange {
                            id: Uuid::new_v4().to_string(),
                            schema: state.schema.clone(),
                            table: state.table.clone(),
                            change_type: ChangeType::Update,
                            primary_key: Some(serde_json::json!({ "pk": pk })),
                            before: Some(old_row.clone()),
                            after: Some(new_row.clone()),
                            timestamp: Utc::now().to_rfc3339(),
                            source: "polling".to_string(),
                        });
                    }
                }
            }
        }

        // Detect DELETEs
        for (pk, old_row) in old_rows {
            if !new_rows.contains_key(pk) {
                changes.push(TableChange {
                    id: Uuid::new_v4().to_string(),
                    schema: state.schema.clone(),
                    table: state.table.clone(),
                    change_type: ChangeType::Delete,
                    primary_key: Some(serde_json::json!({ "pk": pk })),
                    before: Some(old_row.clone()),
                    after: None,
                    timestamp: Utc::now().to_rfc3339(),
                    source: "polling".to_string(),
                });
            }
        }

        // Log and send changes
        if !changes.is_empty() {
            info!(
                "Detected {} changes in {}.{}",
                changes.len(),
                state.schema,
                state.table
            );
        }

        for change in &changes {
            if let Err(e) = tx.send(change.clone()).await {
                warn!("Failed to send change: {}", e);
            }
        }

        // Update state if there were changes
        if !changes.is_empty() || state.row_count != new_count {
            let mut watched = watched_tables.write().await;
            if let Some(table_state) = watched.get_mut(&format!("{}.{}", state.schema, state.table))
            {
                table_state.rows = new_rows;
                table_state.row_count = new_count;
            }
        }

        Ok(())
    }

    /// Get primary key columns for a table
    async fn get_primary_key_columns(
        &self,
        schema: &str,
        table: &str,
    ) -> Result<Vec<String>, String> {
        let conn = self.connection.read().await;
        let client = conn.get_client().ok_or("Not connected")?;

        let rows = client
            .query(
                r#"
            SELECT kcu.column_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
                ON tc.constraint_name = kcu.constraint_name
                AND tc.table_schema = kcu.table_schema
            WHERE tc.constraint_type = 'PRIMARY KEY'
            AND tc.table_schema = $1
            AND tc.table_name = $2
            ORDER BY kcu.ordinal_position
            "#,
                &[&schema, &table],
            )
            .await
            .map_err(|e| e.to_string())?;

        Ok(rows.iter().map(|r| r.get("column_name")).collect())
    }

    /// Fetch table snapshot
    async fn fetch_table_snapshot(
        &self,
        schema: &str,
        table: &str,
        pk_columns: &[String],
    ) -> Result<(HashMap<String, serde_json::Value>, i64), String> {
        let conn = self.connection.read().await;
        Self::fetch_snapshot_static(&conn, schema, table, pk_columns).await
    }

    /// Static version of fetch_snapshot for use in spawned task
    async fn fetch_snapshot_static(
        conn: &super::postgres::PostgresConnection,
        schema: &str,
        table: &str,
        pk_columns: &[String],
    ) -> Result<(HashMap<String, serde_json::Value>, i64), String> {
        let client = conn.get_client().ok_or("Not connected")?;

        // Build PK expression for row identification
        let pk_expr = pk_columns
            .iter()
            .map(|c| format!("COALESCE(t.\"{}\"::text, '')", c))
            .collect::<Vec<_>>()
            .join(" || '::' || ");

        let query = format!(
            "SELECT ({}) as _pk, row_to_json(t.*) as _data FROM \"{}\".\"{}\" t LIMIT 10000",
            pk_expr, schema, table
        );

        let rows = client.query(&query, &[]).await.map_err(|e| e.to_string())?;

        let mut result = HashMap::new();
        for row in rows {
            let pk: String = row.get("_pk");
            let data: serde_json::Value = row.get("_data");
            result.insert(pk, data);
        }

        // Get count
        let count_query = format!("SELECT COUNT(*) as count FROM \"{}\".\"{}\"", schema, table);
        let count_row = client
            .query_one(&count_query, &[])
            .await
            .map_err(|e| e.to_string())?;
        let count: i64 = count_row.get("count");

        Ok((result, count))
    }
}

/// Shared watcher instance
pub type SharedWatcher = Arc<RwLock<Option<TableWatcher>>>;

pub fn create_shared_watcher() -> SharedWatcher {
    Arc::new(RwLock::new(None))
}
