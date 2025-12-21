// ===== Supabase Service =====
// Business logic for Supabase connection management

use crate::commands::types::ConnectionStateResponse;
use crate::db::{
    config::SupabaseConfig,
    supabase::{SharedSupabaseClient, SupabaseClient},
};
use tauri::{AppHandle, Emitter};

/// Test Supabase connection
pub async fn test_connection(config: SupabaseConfig) -> Result<ConnectionStateResponse, String> {
    let ws_url = config.realtime_url();
    tracing::info!("Testing Supabase connection to: {}", ws_url);

    // Try to establish WebSocket connection
    match tokio_tungstenite::connect_async(&ws_url).await {
        Ok(_) => {
            tracing::info!("Supabase WebSocket connection successful");
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

/// Start event forwarding for Supabase
fn start_supabase_event_forwarding(
    mut rx: tokio::sync::mpsc::Receiver<crate::db::schema::TableChange>,
    app: AppHandle,
) {
    tokio::spawn(async move {
        while let Some(change) = rx.recv().await {
            tracing::info!("Supabase event: {:?}", change);
            if let Err(e) = app.emit("db-change", &change) {
                tracing::error!("Failed to emit Supabase event: {}", e);
            }
        }
    });
}

/// Connect to Supabase
pub async fn connect(
    config: SupabaseConfig,
    app: AppHandle,
    supabase_client: SharedSupabaseClient,
) -> Result<ConnectionStateResponse, String> {
    tracing::info!("Connecting to Supabase: {}", config.url);

    let mut client_guard = supabase_client.write().await;

    // Create new client
    let client = SupabaseClient::new(config);

    // Create channel for events
    let (tx, rx) = tokio::sync::mpsc::channel(1000);

    // Start event forwarding
    start_supabase_event_forwarding(rx, app.clone());

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
pub async fn disconnect(
    supabase_client: SharedSupabaseClient,
) -> Result<ConnectionStateResponse, String> {
    tracing::info!("Disconnecting from Supabase");

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
pub async fn get_status(
    supabase_client: SharedSupabaseClient,
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
