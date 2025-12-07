use serde::{Deserialize, Serialize};

/// Table information from database schema
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TableInfo {
    pub schema: String,
    pub name: String,
    pub column_count: u32,
    pub comment: Option<String>,
}

impl TableInfo {
    pub fn full_name(&self) -> String {
        format!("{}.{}", self.schema, self.name)
    }
}

/// Foreign key relationship information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ForeignKeyInfo {
    pub constraint_name: String,
    pub from_schema: String,
    pub from_table: String,
    pub from_column: String,
    pub to_schema: String,
    pub to_table: String,
    pub to_column: String,
    pub on_delete: String,
    pub on_update: String,
}

/// Table statistics from pg_stat_user_tables
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TableStats {
    pub schema: String,
    pub table: String,
    pub n_tup_ins: i64,
    pub n_tup_upd: i64,
    pub n_tup_del: i64,
    pub last_vacuum: Option<String>,
    pub last_autovacuum: Option<String>,
}

/// Database change event
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TableChange {
    pub id: String,
    pub schema: String,
    pub table: String,
    #[serde(rename = "type")]
    pub change_type: ChangeType,
    pub primary_key: Option<serde_json::Value>,
    pub before: Option<serde_json::Value>,
    pub after: Option<serde_json::Value>,
    pub timestamp: String,
    pub source: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "UPPERCASE")]
pub enum ChangeType {
    Insert,
    Update,
    Delete,
}

impl std::fmt::Display for ChangeType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ChangeType::Insert => write!(f, "INSERT"),
            ChangeType::Update => write!(f, "UPDATE"),
            ChangeType::Delete => write!(f, "DELETE"),
        }
    }
}

/// Dry run result - preview of changes without committing
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DryRunResult {
    pub success: bool,
    pub changes: Vec<DryRunChange>,
    pub error: Option<String>,
    pub rows_affected: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DryRunChange {
    pub schema: String,
    pub table: String,
    #[serde(rename = "type")]
    pub change_type: ChangeType,
    pub before: Option<serde_json::Value>,
    pub after: Option<serde_json::Value>,
}
