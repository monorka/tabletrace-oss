// ===== PostgreSQL Connection Commands =====
// Thin boundary layer that delegates to service layer

use super::types::ConnectionStateResponse;
use crate::db::{config::PgConfig, postgres::SharedConnection, watcher::SharedWatcher};
use tauri::State;

/// Test PostgreSQL connection
#[tauri::command]
pub async fn test_connection(config: PgConfig) -> Result<ConnectionStateResponse, String> {
    crate::services::connection::test_connection(config).await
}

/// Connect to PostgreSQL
#[tauri::command]
pub async fn connect_postgres(
    config: PgConfig,
    connection: State<'_, SharedConnection>,
    watcher: State<'_, SharedWatcher>,
) -> Result<ConnectionStateResponse, String> {
    crate::services::connection::connect(
        config,
        connection.inner().clone(),
        watcher.inner().clone(),
    )
    .await
}

/// Disconnect from PostgreSQL
#[tauri::command]
pub async fn disconnect_postgres(
    connection: State<'_, SharedConnection>,
    watcher: State<'_, SharedWatcher>,
) -> Result<ConnectionStateResponse, String> {
    crate::services::connection::disconnect(connection.inner().clone(), watcher.inner().clone())
        .await
}

/// Get connection status
#[tauri::command]
pub async fn get_connection_status(
    connection: State<'_, SharedConnection>,
) -> Result<ConnectionStateResponse, String> {
    crate::services::connection::get_status(connection.inner().clone()).await
}
