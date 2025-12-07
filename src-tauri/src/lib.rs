pub mod commands;
pub mod db;

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
            commands::test_connection,
            commands::connect_postgres,
            commands::disconnect_postgres,
            commands::get_connection_status,
            // Schema commands
            commands::get_tables,
            commands::get_foreign_keys,
            commands::get_table_stats,
            commands::dry_run,
            commands::get_columns,
            commands::get_row_count,
            commands::get_rows,
            // Watcher commands
            commands::start_watching,
            commands::stop_watching,
            commands::get_watched_tables,
            commands::stop_all_watching,
            // Supabase commands
            commands::test_supabase_connection,
            commands::connect_supabase,
            commands::disconnect_supabase,
            commands::get_supabase_status,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
