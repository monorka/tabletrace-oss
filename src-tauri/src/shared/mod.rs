// ===== Shared Types =====
// Types shared between frontend and backend (Tauri boundary)

pub mod dto;
pub mod types;

// Re-export commonly used types
pub use dto::*;
pub use types::*;
