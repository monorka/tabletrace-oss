use serde::{Deserialize, Serialize};

// ===== Type Definitions =====
/// Connection state response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConnectionStateResponse {
    pub status: String,
    pub message: Option<String>,
}
