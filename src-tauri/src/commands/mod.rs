// ===== Re-exports =====
// This module re-exports all command functions from separated modules

pub mod connection;
pub mod schema;
pub mod supabase;
pub mod types;
pub mod watching;

// Re-export types
pub use types::ConnectionStateResponse;

// Re-export PostgreSQL connection commands
pub use connection::{
    connect_postgres, disconnect_postgres, get_connection_status, test_connection,
};

// Re-export schema commands
pub use schema::{
    dry_run, get_columns, get_foreign_keys, get_row_count, get_rows, get_table_stats, get_tables,
};

// Re-export table watching commands
pub use watching::{get_watched_tables, start_watching, stop_all_watching, stop_watching};

// Re-export Supabase connection commands
pub use supabase::{
    connect_supabase, disconnect_supabase, get_supabase_status, test_supabase_connection,
};
