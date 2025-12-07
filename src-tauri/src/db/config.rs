use serde::{Deserialize, Serialize};

/// PostgreSQL connection configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PgConfig {
    pub host: String,
    pub port: u16,
    pub user: String,
    pub password: String,
    pub database: String,
    #[serde(default)]
    pub use_ssl: bool,
    #[serde(default = "default_slot_name")]
    pub slot_name: String,
    #[serde(default = "default_publication_name")]
    pub publication_name: String,
}

fn default_slot_name() -> String {
    "tabletrace_slot".to_string()
}

fn default_publication_name() -> String {
    "tabletrace_pub".to_string()
}

impl PgConfig {
    /// Build a connection string for tokio-postgres
    pub fn connection_string(&self) -> String {
        format!(
            "host={} port={} user={} password={} dbname={}",
            self.host, self.port, self.user, self.password, self.database
        )
    }

    /// Build a connection string for replication
    pub fn replication_connection_string(&self) -> String {
        format!(
            "host={} port={} user={} password={} dbname={} replication=database",
            self.host, self.port, self.user, self.password, self.database
        )
    }
}

impl Default for PgConfig {
    fn default() -> Self {
        Self {
            host: "localhost".to_string(),
            port: 5432,
            user: "postgres".to_string(),
            password: "".to_string(),
            database: "postgres".to_string(),
            use_ssl: false,
            slot_name: default_slot_name(),
            publication_name: default_publication_name(),
        }
    }
}

/// Supabase connection configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SupabaseConfig {
    /// Supabase project URL (e.g., https://xxx.supabase.co)
    pub url: String,
    /// Supabase anon/public key
    pub anon_key: String,
    /// Tables to watch (empty = all tables)
    #[serde(default)]
    pub tables: Vec<String>,
    /// Schemas to watch (default: public)
    #[serde(default = "default_schemas")]
    pub schemas: Vec<String>,
}

fn default_schemas() -> Vec<String> {
    vec!["public".to_string()]
}

impl SupabaseConfig {
    /// Build WebSocket URL for Realtime connection
    pub fn realtime_url(&self) -> String {
        let base = self
            .url
            .replace("https://", "wss://")
            .replace("http://", "ws://");
        format!(
            "{}/realtime/v1/websocket?apikey={}&vsn=1.0.0",
            base, self.anon_key
        )
    }
}

impl Default for SupabaseConfig {
    fn default() -> Self {
        Self {
            url: String::new(),
            anon_key: String::new(),
            tables: Vec::new(),
            schemas: default_schemas(),
        }
    }
}

/// Connection profile for saving/loading configurations
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConnectionProfile {
    pub id: String,
    pub name: String,
    #[serde(rename = "type")]
    pub connection_type: ConnectionType,
    pub config: ConnectionConfig,
    pub color: Option<String>,
    pub is_default: bool,
    pub created_at: String,
    pub last_used_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum ConnectionType {
    Postgres,
    Supabase,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum ConnectionConfig {
    Postgres(PgConfig),
    Supabase(SupabaseConfig),
}
