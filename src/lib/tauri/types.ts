// ===== Type Definitions =====
// Types matching Rust structs

export interface PgConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  use_ssl?: boolean;
  slot_name?: string;
  publication_name?: string;
}

export interface SupabaseConfig {
  url: string;
  anon_key: string;
  tables?: string[];
  schemas?: string[];
}

export type ConnectionType = "postgres" | "supabase";

export interface ConnectionStateResponse {
  status: "disconnected" | "connecting" | "connected" | "reconnecting" | "error";
  message?: string;
}

export interface TableInfo {
  schema: string;
  name: string;
  column_count: number;
  comment?: string;
}

export interface ColumnInfo {
  name: string;
  data_type: string;
  is_nullable: boolean;
  default_value?: string;
  is_primary_key: boolean;
}

export interface ForeignKeyInfo {
  constraint_name: string;
  from_schema: string;
  from_table: string;
  from_column: string;
  to_schema: string;
  to_table: string;
  to_column: string;
  on_delete: string;
  on_update: string;
}

export interface TableStats {
  schema: string;
  table: string;
  n_tup_ins: number;
  n_tup_upd: number;
  n_tup_del: number;
  last_vacuum?: string;
  last_autovacuum?: string;
}

export type ChangeType = "INSERT" | "UPDATE" | "DELETE";

export interface DryRunChange {
  schema: string;
  table: string;
  type: ChangeType;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
}

export interface DryRunResult {
  success: boolean;
  changes: DryRunChange[];
  error?: string;
  rows_affected: number;
}

export interface TableChange {
  id: string;
  schema: string;
  table: string;
  type: ChangeType;
  primary_key?: Record<string, unknown>;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  timestamp: string;
  source: string;
}
