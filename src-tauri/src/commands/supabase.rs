// ===== Supabase Connection Commands =====
// Thin boundary layer that delegates to service layer

use tauri::{AppHandle, State};
use crate::db::{
    config::SupabaseConfig,
    supabase::SharedSupabaseClient,
};
use super::types::ConnectionStateResponse;

/// Test Supabase connection
#[tauri::command]
pub async fn test_supabase_connection(
    config: SupabaseConfig,
) -> Result<ConnectionStateResponse, String> {
    crate::services::supabase::test_connection(config).await
}

/// Connect to Supabase
#[tauri::command]
pub async fn connect_supabase(
    config: SupabaseConfig,
    app: AppHandle,
    supabase_client: State<'_, SharedSupabaseClient>,
) -> Result<ConnectionStateResponse, String> {
    crate::services::supabase::connect(config, app, supabase_client.inner().clone()).await
}

/// Disconnect from Supabase
#[tauri::command]
pub async fn disconnect_supabase(
    supabase_client: State<'_, SharedSupabaseClient>,
) -> Result<ConnectionStateResponse, String> {
    crate::services::supabase::disconnect(supabase_client.inner().clone()).await
}

/// Get Supabase connection status
#[tauri::command]
pub async fn get_supabase_status(
    supabase_client: State<'_, SharedSupabaseClient>,
) -> Result<ConnectionStateResponse, String> {
    crate::services::supabase::get_status(supabase_client.inner().clone()).await
}
