// ===== Schema Commands =====
// Thin boundary layer that delegates to service layer

use tauri::State;
use crate::db::postgres::SharedConnection;

/// Get list of tables
#[tauri::command]
pub async fn get_tables(connection: State<'_, SharedConnection>) -> Result<Vec<crate::db::schema::TableInfo>, String> {
    crate::services::schema::get_tables(connection.inner().clone()).await
}

/// Get foreign key relationships
#[tauri::command]
pub async fn get_foreign_keys(
    connection: State<'_, SharedConnection>,
) -> Result<Vec<crate::db::schema::ForeignKeyInfo>, String> {
    crate::services::schema::get_foreign_keys(connection.inner().clone()).await
}

/// Get table statistics from pg_stat_user_tables (lightweight change detection)
#[tauri::command]
pub async fn get_table_stats(
    connection: State<'_, SharedConnection>,
) -> Result<Vec<crate::db::schema::TableStats>, String> {
    crate::services::schema::get_table_stats(connection.inner().clone()).await
}

/// Execute SQL in dry run mode (preview changes without committing)
#[tauri::command]
pub async fn dry_run(
    sql: String,
    connection: State<'_, SharedConnection>,
) -> Result<crate::db::schema::DryRunResult, String> {
    crate::services::schema::dry_run(sql, connection.inner().clone()).await
}

/// Get columns for a table
#[tauri::command]
pub async fn get_columns(
    schema: String,
    table: String,
    connection: State<'_, SharedConnection>,
) -> Result<Vec<crate::db::postgres::ColumnInfo>, String> {
    crate::services::schema::get_columns(schema, table, connection.inner().clone()).await
}

/// Get row count for a table
#[tauri::command]
pub async fn get_row_count(
    schema: String,
    table: String,
    connection: State<'_, SharedConnection>,
) -> Result<i64, String> {
    crate::services::schema::get_row_count(schema, table, connection.inner().clone()).await
}

/// Get rows from a table
#[tauri::command]
pub async fn get_rows(
    schema: String,
    table: String,
    limit: Option<i64>,
    offset: Option<i64>,
    connection: State<'_, SharedConnection>,
) -> Result<Vec<serde_json::Value>, String> {
    crate::services::schema::get_rows(schema, table, limit, offset, connection.inner().clone()).await
}
