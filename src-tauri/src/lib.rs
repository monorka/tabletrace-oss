pub mod commands;
pub mod db;
pub mod services;
pub mod shared;

use db::postgres::create_shared_connection;
use db::supabase::create_shared_supabase_client;
use db::watcher::create_shared_watcher;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Initialize tracing
    tracing_subscriber::registry()
        .with(tracing_subscriber::fmt::layer())
        .with(
            tracing_subscriber::EnvFilter::from_default_env()
                .add_directive("tabletrace=debug".parse().unwrap()),
        )
        .init();

    // Create shared state
    let connection = create_shared_connection();
    let watcher = create_shared_watcher();
    let supabase_client = create_shared_supabase_client();

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .manage(connection)
        .manage(watcher)
        .manage(supabase_client)
        .invoke_handler(tauri::generate_handler![
            // PostgreSQL connection commands
            commands::connection::test_connection,
            commands::connection::connect_postgres,
            commands::connection::disconnect_postgres,
            commands::connection::get_connection_status,
            // Schema commands
            commands::schema::get_tables,
            commands::schema::get_foreign_keys,
            commands::schema::get_table_stats,
            commands::schema::dry_run,
            commands::schema::get_columns,
            commands::schema::get_row_count,
            commands::schema::get_rows,
            // Watcher commands
            commands::watching::start_watching,
            commands::watching::stop_watching,
            commands::watching::get_watched_tables,
            commands::watching::stop_all_watching,
            // Supabase commands
            commands::supabase::test_supabase_connection,
            commands::supabase::connect_supabase,
            commands::supabase::disconnect_supabase,
            commands::supabase::get_supabase_status,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
