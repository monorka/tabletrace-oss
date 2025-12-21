// ===== Shared Type Definitions =====
// Core types used across the Tauri boundary

use serde::{Deserialize, Serialize};

/// Connection state response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConnectionStateResponse {
    pub status: String,
    pub message: Option<String>,
}
