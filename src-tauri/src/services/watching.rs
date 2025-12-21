// ===== Watching Service =====
// Business logic for table watching operations

use crate::db::{
    postgres::SharedConnection,
    watcher::{SharedWatcher, TableWatcher, WatcherConfig},
};
use tauri::{AppHandle, Emitter};

/// Initialize watcher if needed and return whether it needs to be started
pub async fn ensure_watcher_initialized(
    watcher: &SharedWatcher,
    connection: SharedConnection,
) -> Result<bool, String> {
    let mut watcher_guard = watcher.write().await;
    if watcher_guard.is_none() {
        let config = WatcherConfig::default();
        let new_watcher = TableWatcher::new(connection, config);
        *watcher_guard = Some(new_watcher);
        Ok(true)
    } else {
        let w = watcher_guard.as_ref().unwrap();
        Ok(!w.is_running().await)
    }
}

/// Add table to watch list
pub async fn add_table_to_watch(
    schema: &str,
    table: &str,
    watcher: &SharedWatcher,
) -> Result<(), String> {
    let watcher_guard = watcher.read().await;
    if let Some(w) = watcher_guard.as_ref() {
        w.add_table(schema, table).await?;
    }
    Ok(())
}

/// Start event forwarding loop
pub fn start_event_forwarding(watcher: SharedWatcher, app: AppHandle) {
    tokio::spawn(async move {
        let rx_opt = {
            let watcher_guard = watcher.read().await;
            if let Some(w) = watcher_guard.as_ref() {
                w.start().await
            } else {
                None
            }
        };

        if let Some(mut rx) = rx_opt {
            tracing::info!("Event forwarding loop started");
            // Forward changes to frontend
            while let Some(change) = rx.recv().await {
                tracing::info!(
                    "Emitting change event: {:?} on {}.{}",
                    change.change_type,
                    change.schema,
                    change.table
                );
                if let Err(e) = app.emit("db-change", &change) {
                    tracing::error!("Failed to emit event: {}", e);
                }
            }
            tracing::info!("Event forwarding loop ended");
        }
    });
}

/// Start watching a table
pub async fn start_watching(
    schema: String,
    table: String,
    app: AppHandle,
    connection: SharedConnection,
    watcher: SharedWatcher,
) -> Result<(), String> {
    tracing::info!("Starting to watch table: {}.{}", schema, table);

    // Initialize watcher if needed
    let need_start = ensure_watcher_initialized(&watcher, connection.clone()).await?;

    // Add table to watch list
    add_table_to_watch(&schema, &table, &watcher).await?;

    // Start watcher if not already running
    if need_start {
        start_event_forwarding(watcher.clone(), app);
    } else {
        tracing::info!("Watcher already running, just added table to watch list");
    }

    Ok(())
}

/// Stop watching a table
pub async fn stop_watching(
    schema: String,
    table: String,
    watcher: SharedWatcher,
) -> Result<(), String> {
    tracing::info!("Stopping watch for table: {}.{}", schema, table);

    let watcher_guard = watcher.read().await;
    if let Some(w) = watcher_guard.as_ref() {
        w.remove_table(&schema, &table).await;
    }

    Ok(())
}

/// Get list of watched tables
pub async fn get_watched_tables(watcher: SharedWatcher) -> Result<Vec<String>, String> {
    let watcher_guard = watcher.read().await;
    if let Some(w) = watcher_guard.as_ref() {
        Ok(w.get_watched_tables().await)
    } else {
        Ok(vec![])
    }
}

/// Stop all watching
pub async fn stop_all_watching(watcher: SharedWatcher) -> Result<(), String> {
    tracing::info!("Stopping all watching");

    let watcher_guard = watcher.read().await;
    if let Some(w) = watcher_guard.as_ref() {
        w.stop().await;
    }

    Ok(())
}
