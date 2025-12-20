// ===== Table Watching Commands =====
// Thin boundary layer that delegates to service layer

use tauri::{AppHandle, State};
use crate::db::{
    postgres::SharedConnection,
    watcher::SharedWatcher,
};

/// Start watching a table
#[tauri::command]
pub async fn start_watching(
    schema: String,
    table: String,
    app: AppHandle,
    connection: State<'_, SharedConnection>,
    watcher: State<'_, SharedWatcher>,
) -> Result<(), String> {
    crate::services::watching::start_watching(
        schema,
        table,
        app,
        connection.inner().clone(),
        watcher.inner().clone(),
    ).await
}

/// Stop watching a table
#[tauri::command]
pub async fn stop_watching(
    schema: String,
    table: String,
    watcher: State<'_, SharedWatcher>,
) -> Result<(), String> {
    crate::services::watching::stop_watching(schema, table, watcher.inner().clone()).await
}

/// Get list of watched tables
#[tauri::command]
pub async fn get_watched_tables(watcher: State<'_, SharedWatcher>) -> Result<Vec<String>, String> {
    crate::services::watching::get_watched_tables(watcher.inner().clone()).await
}

/// Stop all watching
#[tauri::command]
pub async fn stop_all_watching(watcher: State<'_, SharedWatcher>) -> Result<(), String> {
    crate::services::watching::stop_all_watching(watcher.inner().clone()).await
}
