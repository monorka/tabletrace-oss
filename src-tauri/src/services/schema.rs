// ===== Schema Service =====
// Business logic for schema-related operations

use crate::db::{
    postgres::SharedConnection,
    schema::{DryRunResult, ForeignKeyInfo, TableInfo, TableStats},
};

/// Ensure connection is established
fn ensure_connected(conn: &crate::db::postgres::PostgresConnection) -> Result<(), String> {
    if !conn.is_connected() {
        return Err("Not connected to database".to_string());
    }
    Ok(())
}

/// Get list of tables
pub async fn get_tables(connection: SharedConnection) -> Result<Vec<TableInfo>, String> {
    let conn = connection.read().await;
    ensure_connected(&conn)?;
    conn.get_tables()
        .await
        .map_err(|e| format!("Failed to get tables: {}", e))
}

/// Get foreign key relationships
pub async fn get_foreign_keys(
    connection: SharedConnection,
) -> Result<Vec<ForeignKeyInfo>, String> {
    let conn = connection.read().await;
    ensure_connected(&conn)?;
    conn.get_foreign_keys()
        .await
        .map_err(|e| format!("Failed to get foreign keys: {}", e))
}

/// Get table statistics from pg_stat_user_tables
pub async fn get_table_stats(
    connection: SharedConnection,
) -> Result<Vec<TableStats>, String> {
    let conn = connection.read().await;
    ensure_connected(&conn)?;
    conn.get_table_stats()
        .await
        .map_err(|e| format!("Failed to get table stats: {}", e))
}

/// Execute SQL in dry run mode
pub async fn dry_run(
    sql: String,
    connection: SharedConnection,
) -> Result<DryRunResult, String> {
    tracing::info!("Executing dry run SQL");
    let conn = connection.read().await;
    ensure_connected(&conn)?;
    conn.dry_run(&sql).await
}

/// Get columns for a table
pub async fn get_columns(
    schema: String,
    table: String,
    connection: SharedConnection,
) -> Result<Vec<crate::db::postgres::ColumnInfo>, String> {
    let conn = connection.read().await;
    ensure_connected(&conn)?;
    conn.get_columns(&schema, &table)
        .await
        .map_err(|e| format!("Failed to get columns: {}", e))
}

/// Get row count for a table
pub async fn get_row_count(
    schema: String,
    table: String,
    connection: SharedConnection,
) -> Result<i64, String> {
    let conn = connection.read().await;
    ensure_connected(&conn)?;
    conn.get_row_count(&schema, &table)
        .await
        .map_err(|e| format!("Failed to get row count: {}", e))
}

/// Get rows from a table
pub async fn get_rows(
    schema: String,
    table: String,
    limit: Option<i64>,
    offset: Option<i64>,
    connection: SharedConnection,
) -> Result<Vec<serde_json::Value>, String> {
    let conn = connection.read().await;
    ensure_connected(&conn)?;
    conn.get_rows(&schema, &table, limit.unwrap_or(100), offset.unwrap_or(0))
        .await
        .map_err(|e| format!("Failed to get rows: {}", e))
}
