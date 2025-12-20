// ===== Re-exports =====
// This module re-exports all command functions from separated modules

pub mod types;
pub mod connection;
pub mod schema;
pub mod watching;
pub mod supabase;

// Re-export types
pub use types::ConnectionStateResponse;

// Re-export PostgreSQL connection commands
pub use connection::{
    test_connection,
    connect_postgres,
    disconnect_postgres,
    get_connection_status,
};

// Re-export schema commands
pub use schema::{
    get_tables,
    get_foreign_keys,
    get_table_stats,
    dry_run,
    get_columns,
    get_row_count,
    get_rows,
};

// Re-export table watching commands
pub use watching::{
    start_watching,
    stop_watching,
    get_watched_tables,
    stop_all_watching,
};

// Re-export Supabase connection commands
pub use supabase::{
    test_supabase_connection,
    connect_supabase,
    disconnect_supabase,
    get_supabase_status,
};
