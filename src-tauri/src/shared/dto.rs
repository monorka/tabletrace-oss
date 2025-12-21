// ===== DTOs (Data Transfer Objects) =====
// Input/Output types for Tauri commands

use serde::{Deserialize, Serialize};

// Re-export config types from db module
pub use crate::db::config::{PgConfig, SupabaseConfig};

// Re-export schema types from db module
pub use crate::db::schema::{
    ChangeType, DryRunChange, DryRunResult, ForeignKeyInfo, TableChange, TableInfo, TableStats,
};

// Re-export postgres types
pub use crate::db::postgres::ColumnInfo;

// ===== Connection DTOs =====

/// Input for test_connection command
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TestConnectionInput {
    pub config: PgConfig,
}

/// Input for connect_postgres command
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConnectPostgresInput {
    pub config: PgConfig,
}

/// Input for test_supabase_connection command
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TestSupabaseConnectionInput {
    pub config: SupabaseConfig,
}

/// Input for connect_supabase command
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConnectSupabaseInput {
    pub config: SupabaseConfig,
}

// ===== Schema DTOs =====

/// Input for get_columns command
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetColumnsInput {
    pub schema: String,
    pub table: String,
}

/// Input for get_row_count command
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetRowCountInput {
    pub schema: String,
    pub table: String,
}

/// Input for get_rows command
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetRowsInput {
    pub schema: String,
    pub table: String,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

/// Input for dry_run command
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DryRunInput {
    pub sql: String,
}

// ===== Watching DTOs =====

/// Input for start_watching command
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StartWatchingInput {
    pub schema: String,
    pub table: String,
}

/// Input for stop_watching command
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StopWatchingInput {
    pub schema: String,
    pub table: String,
}
