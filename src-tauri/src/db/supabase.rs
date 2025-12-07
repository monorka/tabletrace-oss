use std::sync::Arc;

use futures_util::{SinkExt, StreamExt};
use serde::{Deserialize, Serialize};
use tokio::sync::{mpsc, RwLock};
use tokio_tungstenite::{connect_async, tungstenite::Message};
use tracing::{debug, error, info, warn};
use uuid::Uuid;

use super::config::SupabaseConfig;
use super::schema::{ChangeType, TableChange};

/// Supabase Realtime payload structure (Pro feature - fields reserved for future use)
#[allow(dead_code)]
#[derive(Debug, Deserialize)]
struct RealtimePayload {
    schema: Option<String>,
    table: Option<String>,
    commit_timestamp: Option<String>,
    #[serde(rename = "eventType")]
    event_type: Option<String>,
    new: Option<serde_json::Value>,
    old: Option<serde_json::Value>,
    columns: Option<Vec<RealtimeColumn>>,
}

/// Column metadata for Realtime (Pro feature)
#[allow(dead_code)]
#[derive(Debug, Deserialize)]
struct RealtimeColumn {
    name: String,
    #[serde(rename = "type")]
    data_type: String,
}

/// Phoenix message structure
#[derive(Debug, Serialize, Deserialize)]
struct PhoenixMessage {
    topic: String,
    event: String,
    payload: serde_json::Value,
    #[serde(rename = "ref")]
    reference: Option<String>,
}

/// Supabase connection state
#[derive(Debug, Clone, PartialEq)]
pub enum SupabaseConnectionState {
    Disconnected,
    Connecting,
    Connected,
    Reconnecting { attempt: u32 },
    Error { message: String },
}

/// Supabase Realtime client (Pro feature)
#[allow(dead_code)]
pub struct SupabaseClient {
    config: SupabaseConfig,
    state: SupabaseConnectionState,
    watched_tables: Vec<String>,
}

impl SupabaseClient {
    pub fn new(config: SupabaseConfig) -> Self {
        Self {
            config,
            state: SupabaseConnectionState::Disconnected,
            watched_tables: Vec::new(),
        }
    }

    pub fn config(&self) -> &SupabaseConfig {
        &self.config
    }

    pub fn is_connected(&self) -> bool {
        matches!(self.state, SupabaseConnectionState::Connected)
    }

    pub fn get_state(&self) -> &SupabaseConnectionState {
        &self.state
    }

    /// Connect and start receiving events
    pub async fn connect(&mut self, tx: mpsc::Sender<TableChange>) -> Result<(), String> {
        self.state = SupabaseConnectionState::Connecting;
        info!("Connecting to Supabase Realtime: {}", self.config.url);

        let ws_url = self.config.realtime_url();

        let (ws_stream, _) = connect_async(&ws_url)
            .await
            .map_err(|e| format!("WebSocket connection failed: {}", e))?;

        info!("WebSocket connected to Supabase");
        self.state = SupabaseConnectionState::Connected;

        let (mut write, mut read) = ws_stream.split();

        // Join the realtime channel
        let join_msg = PhoenixMessage {
            topic: "realtime:*".to_string(),
            event: "phx_join".to_string(),
            payload: serde_json::json!({
                "config": {
                    "postgres_changes": self.build_postgres_changes_config()
                }
            }),
            reference: Some("1".to_string()),
        };

        let join_json = serde_json::to_string(&join_msg)
            .map_err(|e| format!("Failed to serialize join message: {}", e))?;

        write
            .send(Message::Text(join_json))
            .await
            .map_err(|e| format!("Failed to send join message: {}", e))?;

        info!("Joined Supabase realtime channel");

        // Spawn heartbeat task
        let heartbeat_handle = tokio::spawn(async move {
            let mut interval = tokio::time::interval(std::time::Duration::from_secs(30));
            loop {
                interval.tick().await;
                let heartbeat = PhoenixMessage {
                    topic: "phoenix".to_string(),
                    event: "heartbeat".to_string(),
                    payload: serde_json::json!({}),
                    reference: None,
                };
                if let Ok(_json) = serde_json::to_string(&heartbeat) {
                    // Note: In a real implementation, we'd need to share the write half
                    debug!("Heartbeat would be sent");
                }
            }
        });

        // Process incoming messages
        while let Some(msg) = read.next().await {
            match msg {
                Ok(Message::Text(text)) => {
                    if let Some(change) = self.parse_realtime_message(&text) {
                        if let Err(e) = tx.send(change).await {
                            warn!("Failed to send change event: {}", e);
                        }
                    }
                }
                Ok(Message::Close(_)) => {
                    info!("WebSocket closed by server");
                    break;
                }
                Ok(Message::Ping(_data)) => {
                    debug!("Received ping");
                }
                Err(e) => {
                    error!("WebSocket error: {}", e);
                    self.state = SupabaseConnectionState::Error {
                        message: e.to_string(),
                    };
                    break;
                }
                _ => {}
            }
        }

        heartbeat_handle.abort();
        self.state = SupabaseConnectionState::Disconnected;
        Ok(())
    }

    /// Build postgres_changes config for subscription
    fn build_postgres_changes_config(&self) -> Vec<serde_json::Value> {
        if self.config.tables.is_empty() {
            // Watch all tables in specified schemas
            self.config
                .schemas
                .iter()
                .map(|schema| {
                    serde_json::json!({
                        "event": "*",
                        "schema": schema
                    })
                })
                .collect()
        } else {
            // Watch specific tables
            self.config
                .tables
                .iter()
                .flat_map(|table| {
                    self.config.schemas.iter().map(move |schema| {
                        serde_json::json!({
                            "event": "*",
                            "schema": schema,
                            "table": table
                        })
                    })
                })
                .collect()
        }
    }

    /// Parse a Supabase Realtime message into TableChange
    fn parse_realtime_message(&self, text: &str) -> Option<TableChange> {
        let msg: PhoenixMessage = serde_json::from_str(text).ok()?;

        // Only process postgres_changes events
        if msg.event != "postgres_changes" {
            return None;
        }

        let payload: RealtimePayload = serde_json::from_value(msg.payload).ok()?;

        let schema = payload.schema.unwrap_or_else(|| "public".to_string());
        let table = payload.table?;
        let event_type = payload.event_type?;

        let change_type = match event_type.as_str() {
            "INSERT" => ChangeType::Insert,
            "UPDATE" => ChangeType::Update,
            "DELETE" => ChangeType::Delete,
            _ => return None,
        };

        let timestamp = payload
            .commit_timestamp
            .unwrap_or_else(|| chrono::Utc::now().to_rfc3339());

        // Extract primary key from new or old record
        let primary_key = payload
            .new
            .as_ref()
            .or(payload.old.as_ref())
            .and_then(|v| v.get("id"))
            .map(|id| serde_json::json!({ "id": id }));

        Some(TableChange {
            id: Uuid::new_v4().to_string(),
            schema,
            table,
            change_type,
            primary_key,
            before: payload
                .old
                .and_then(|v| v.as_object().cloned())
                .map(serde_json::Value::Object),
            after: payload
                .new
                .and_then(|v| v.as_object().cloned())
                .map(serde_json::Value::Object),
            timestamp,
            source: "supabase".to_string(),
        })
    }

    pub fn disconnect(&mut self) {
        self.state = SupabaseConnectionState::Disconnected;
        info!("Supabase client disconnected");
    }
}

/// Shared Supabase client
pub type SharedSupabaseClient = Arc<RwLock<Option<SupabaseClient>>>;

pub fn create_shared_supabase_client() -> SharedSupabaseClient {
    Arc::new(RwLock::new(None))
}
