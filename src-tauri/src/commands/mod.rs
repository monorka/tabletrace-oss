use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter, State};
use tracing::info;

use crate::db::{
    config::{PgConfig, SupabaseConfig},
    postgres::{ColumnInfo, SharedConnection},
    schema::{DryRunResult, ForeignKeyInfo, TableInfo, TableStats},
    supabase::{SharedSupabaseClient, SupabaseClient},
    watcher::{SharedWatcher, TableWatcher, WatcherConfig},
};

/// Connection state response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConnectionStateResponse {
    pub status: String,
    pub message: Option<String>,
}

/// Test PostgreSQL connection
#[tauri::command]
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
#[tauri::command]
pub async fn connect_postgres(
    config: PgConfig,
    connection: State<'_, SharedConnection>,
    watcher: State<'_, SharedWatcher>,
) -> Result<ConnectionStateResponse, String> {
    // Clear any existing watcher state from previous connection
    {
        let watcher_guard = watcher.read().await;
        if let Some(w) = watcher_guard.as_ref() {
            w.stop().await;
            w.clear().await;
        }
    }

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
#[tauri::command]
pub async fn disconnect_postgres(
    connection: State<'_, SharedConnection>,
    watcher: State<'_, SharedWatcher>,
) -> Result<ConnectionStateResponse, String> {
    // Stop watcher and clear snapshots
    {
        let watcher_guard = watcher.read().await;
        if let Some(w) = watcher_guard.as_ref() {
            w.stop().await;
            w.clear().await;
        }
    }

    // Then disconnect
    let mut conn = connection.write().await;
    conn.disconnect().await;

    Ok(ConnectionStateResponse {
        status: "disconnected".to_string(),
        message: Some("Disconnected from PostgreSQL".to_string()),
    })
}

/// Get connection status
#[tauri::command]
pub async fn get_connection_status(
    connection: State<'_, SharedConnection>,
) -> Result<ConnectionStateResponse, String> {
    let conn = connection.read().await;

    let (status, message) = match conn.state() {
        crate::db::postgres::ConnectionState::Disconnected => ("disconnected", None),
        crate::db::postgres::ConnectionState::Connecting => ("connecting", None),
        crate::db::postgres::ConnectionState::Connected => ("connected", None),
        crate::db::postgres::ConnectionState::Reconnecting { attempt } => {
            ("reconnecting", Some(format!("Attempt {}", attempt)))
        }
        crate::db::postgres::ConnectionState::Error { message } => ("error", Some(message.clone())),
    };

    Ok(ConnectionStateResponse {
        status: status.to_string(),
        message: message.map(|s| s.to_string()),
    })
}

/// Get list of tables
#[tauri::command]
pub async fn get_tables(connection: State<'_, SharedConnection>) -> Result<Vec<TableInfo>, String> {
    let conn = connection.read().await;

    if !conn.is_connected() {
        return Err("Not connected to database".to_string());
    }

    conn.get_tables()
        .await
        .map_err(|e| format!("Failed to get tables: {}", e))
}

/// Get foreign key relationships
#[tauri::command]
pub async fn get_foreign_keys(
    connection: State<'_, SharedConnection>,
) -> Result<Vec<ForeignKeyInfo>, String> {
    let conn = connection.read().await;

    if !conn.is_connected() {
        return Err("Not connected to database".to_string());
    }

    conn.get_foreign_keys()
        .await
        .map_err(|e| format!("Failed to get foreign keys: {}", e))
}

/// Get table statistics from pg_stat_user_tables (lightweight change detection)
#[tauri::command]
pub async fn get_table_stats(
    connection: State<'_, SharedConnection>,
) -> Result<Vec<TableStats>, String> {
    let conn = connection.read().await;

    if !conn.is_connected() {
        return Err("Not connected to database".to_string());
    }

    conn.get_table_stats()
        .await
        .map_err(|e| format!("Failed to get table stats: {}", e))
}

/// Execute SQL in dry run mode (preview changes without committing)
#[tauri::command]
pub async fn dry_run(
    sql: String,
    connection: State<'_, SharedConnection>,
) -> Result<DryRunResult, String> {
    info!("Executing dry run SQL");
    let conn = connection.read().await;

    if !conn.is_connected() {
        return Err("Not connected to database".to_string());
    }

    conn.dry_run(&sql).await
}

/// Get columns for a table
#[tauri::command]
pub async fn get_columns(
    schema: String,
    table: String,
    connection: State<'_, SharedConnection>,
) -> Result<Vec<ColumnInfo>, String> {
    let conn = connection.read().await;

    if !conn.is_connected() {
        return Err("Not connected to database".to_string());
    }

    conn.get_columns(&schema, &table)
        .await
        .map_err(|e| format!("Failed to get columns: {}", e))
}

/// Get row count for a table
#[tauri::command]
pub async fn get_row_count(
    schema: String,
    table: String,
    connection: State<'_, SharedConnection>,
) -> Result<i64, String> {
    let conn = connection.read().await;

    if !conn.is_connected() {
        return Err("Not connected to database".to_string());
    }

    conn.get_row_count(&schema, &table)
        .await
        .map_err(|e| format!("Failed to get row count: {}", e))
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
    let conn = connection.read().await;

    if !conn.is_connected() {
        return Err("Not connected to database".to_string());
    }

    conn.get_rows(&schema, &table, limit.unwrap_or(100), offset.unwrap_or(0))
        .await
        .map_err(|e| format!("Failed to get rows: {}", e))
}

// ============ Watcher Commands ============

/// Start watching a table
#[tauri::command]
pub async fn start_watching(
    schema: String,
    table: String,
    app: AppHandle,
    connection: State<'_, SharedConnection>,
    watcher: State<'_, SharedWatcher>,
) -> Result<(), String> {
    info!("Starting to watch table: {}.{}", schema, table);

    // Initialize watcher if not exists
    let need_start = {
        let mut watcher_guard = watcher.write().await;
        if watcher_guard.is_none() {
            let config = WatcherConfig::default();
            let new_watcher = TableWatcher::new(connection.inner().clone(), config);
            *watcher_guard = Some(new_watcher);
            true
        } else {
            let w = watcher_guard.as_ref().unwrap();
            !w.is_running().await
        }
    };

    // Add table to watch list
    {
        let watcher_guard = watcher.read().await;
        if let Some(w) = watcher_guard.as_ref() {
            w.add_table(&schema, &table).await?;
        }
    }

    // Start watcher if not already running
    if need_start {
        let watcher_clone = watcher.inner().clone();
        let app_clone = app.clone();

        tokio::spawn(async move {
            let rx_opt = {
                let watcher_guard = watcher_clone.read().await;
                if let Some(w) = watcher_guard.as_ref() {
                    w.start().await
                } else {
                    None
                }
            };

            if let Some(mut rx) = rx_opt {
                info!("Event forwarding loop started");
                // Forward changes to frontend
                while let Some(change) = rx.recv().await {
                    info!(
                        "Emitting change event: {:?} on {}.{}",
                        change.change_type, change.schema, change.table
                    );
                    if let Err(e) = app_clone.emit("db-change", &change) {
                        tracing::error!("Failed to emit event: {}", e);
                    }
                }
                info!("Event forwarding loop ended");
            }
        });
    } else {
        info!("Watcher already running, just added table to watch list");
    }

    Ok(())
}

/// Stop watching a table
#[tauri::command]
pub async fn stop_watching(
    schema: String,
    table: String,
    watcher: State<'_, SharedWatcher>,
) -> Result<(), String> {
    info!("Stopping watch for table: {}.{}", schema, table);

    let watcher_guard = watcher.read().await;
    if let Some(w) = watcher_guard.as_ref() {
        w.remove_table(&schema, &table).await;
    }

    Ok(())
}

/// Get list of watched tables
#[tauri::command]
pub async fn get_watched_tables(watcher: State<'_, SharedWatcher>) -> Result<Vec<String>, String> {
    let watcher_guard = watcher.read().await;
    if let Some(w) = watcher_guard.as_ref() {
        Ok(w.get_watched_tables().await)
    } else {
        Ok(vec![])
    }
}

/// Stop all watching
#[tauri::command]
pub async fn stop_all_watching(watcher: State<'_, SharedWatcher>) -> Result<(), String> {
    info!("Stopping all watching");

    let watcher_guard = watcher.read().await;
    if let Some(w) = watcher_guard.as_ref() {
        w.stop().await;
    }

    Ok(())
}

// ============ Supabase Commands ============

/// Test Supabase connection
#[tauri::command]
pub async fn test_supabase_connection(
    config: SupabaseConfig,
) -> Result<ConnectionStateResponse, String> {
    let ws_url = config.realtime_url();
    info!("Testing Supabase connection to: {}", ws_url);

    // Try to establish WebSocket connection
    match tokio_tungstenite::connect_async(&ws_url).await {
        Ok(_) => {
            info!("Supabase WebSocket connection successful");
            Ok(ConnectionStateResponse {
                status: "connected".to_string(),
                message: Some("Supabase connection successful".to_string()),
            })
        }
        Err(e) => {
            let error_msg = format!("WebSocket connection failed: {}. URL: {}", e, ws_url);
            tracing::error!("{}", error_msg);
            Err(error_msg)
        }
    }
}

/// Connect to Supabase
#[tauri::command]
pub async fn connect_supabase(
    config: SupabaseConfig,
    app: AppHandle,
    supabase_client: State<'_, SharedSupabaseClient>,
) -> Result<ConnectionStateResponse, String> {
    info!("Connecting to Supabase: {}", config.url);

    let mut client_guard = supabase_client.write().await;

    // Create new client
    let client = SupabaseClient::new(config);

    // Create channel for events
    let (tx, mut rx) = tokio::sync::mpsc::channel(1000);

    // Clone for the spawn
    let app_clone = app.clone();

    // Spawn event forwarding task
    tokio::spawn(async move {
        while let Some(change) = rx.recv().await {
            info!("Supabase event: {:?}", change);
            if let Err(e) = app_clone.emit("db-change", &change) {
                tracing::error!("Failed to emit Supabase event: {}", e);
            }
        }
    });

    // Start connection in background
    let client_for_connect = SupabaseClient::new(client.config().clone());
    tokio::spawn(async move {
        let mut c = client_for_connect;
        if let Err(e) = c.connect(tx).await {
            tracing::error!("Supabase connection error: {}", e);
        }
    });

    *client_guard = Some(client);

    Ok(ConnectionStateResponse {
        status: "connected".to_string(),
        message: Some("Connected to Supabase".to_string()),
    })
}

/// Disconnect from Supabase
#[tauri::command]
pub async fn disconnect_supabase(
    supabase_client: State<'_, SharedSupabaseClient>,
) -> Result<ConnectionStateResponse, String> {
    info!("Disconnecting from Supabase");

    let mut client_guard = supabase_client.write().await;
    if let Some(ref mut client) = *client_guard {
        client.disconnect();
    }
    *client_guard = None;

    Ok(ConnectionStateResponse {
        status: "disconnected".to_string(),
        message: Some("Disconnected from Supabase".to_string()),
    })
}

/// Get Supabase connection status
#[tauri::command]
pub async fn get_supabase_status(
    supabase_client: State<'_, SharedSupabaseClient>,
) -> Result<ConnectionStateResponse, String> {
    let client_guard = supabase_client.read().await;

    if let Some(ref client) = *client_guard {
        let status = if client.is_connected() {
            "connected"
        } else {
            "disconnected"
        };
        Ok(ConnectionStateResponse {
            status: status.to_string(),
            message: None,
        })
    } else {
        Ok(ConnectionStateResponse {
            status: "disconnected".to_string(),
            message: None,
        })
    }
}
