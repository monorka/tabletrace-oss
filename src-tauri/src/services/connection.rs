// ===== Connection Service =====
// Business logic for PostgreSQL connection management

use crate::commands::types::ConnectionStateResponse;
use crate::db::{
    config::PgConfig,
    postgres::{ConnectionState, SharedConnection},
    watcher::SharedWatcher,
};

/// Clear watcher state (helper function)
pub async fn clear_watcher_state(watcher: &SharedWatcher) -> Result<(), String> {
    let watcher_guard = watcher.read().await;
    if let Some(w) = watcher_guard.as_ref() {
        w.stop().await;
        w.clear().await;
    }
    Ok(())
}

/// Test PostgreSQL connection
pub async fn test_connection(config: PgConfig) -> Result<ConnectionStateResponse, String> {
    match crate::db::postgres::PostgresConnection::test_connection(&config).await {
        Ok(_) => Ok(ConnectionStateResponse {
            status: "connected".to_string(),
            message: Some("Connection successful".to_string()),
        }),
        Err(e) => Err(format!("Connection failed: {}", e)),
    }
}

/// Connect to PostgreSQL
pub async fn connect(
    config: PgConfig,
    connection: SharedConnection,
    watcher: SharedWatcher,
) -> Result<ConnectionStateResponse, String> {
    // Clear any existing watcher state from previous connection
    clear_watcher_state(&watcher).await?;

    // Establish connection
    let mut conn = connection.write().await;
    match conn.connect(config).await {
        Ok(_) => Ok(ConnectionStateResponse {
            status: "connected".to_string(),
            message: Some("Connected to PostgreSQL".to_string()),
        }),
        Err(e) => Err(format!("Connection failed: {}", e)),
    }
}

/// Disconnect from PostgreSQL
pub async fn disconnect(
    connection: SharedConnection,
    watcher: SharedWatcher,
) -> Result<ConnectionStateResponse, String> {
    // Stop watcher and clear snapshots
    clear_watcher_state(&watcher).await?;

    // Disconnect
    let mut conn = connection.write().await;
    conn.disconnect().await;

    Ok(ConnectionStateResponse {
        status: "disconnected".to_string(),
        message: Some("Disconnected from PostgreSQL".to_string()),
    })
}

/// Get connection status
pub async fn get_status(connection: SharedConnection) -> Result<ConnectionStateResponse, String> {
    let conn = connection.read().await;

    let (status, message) = match conn.state() {
        ConnectionState::Disconnected => ("disconnected", None),
        ConnectionState::Connecting => ("connecting", None),
        ConnectionState::Connected => ("connected", None),
        ConnectionState::Reconnecting { attempt } => {
            ("reconnecting", Some(format!("Attempt {}", attempt)))
        }
        ConnectionState::Error { message } => ("error", Some(message.clone())),
    };

    Ok(ConnectionStateResponse {
        status: status.to_string(),
        message: message.map(|s| s.to_string()),
    })
}
