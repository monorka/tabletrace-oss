import { invoke } from "@tauri-apps/api/core";
import type {
  PgConfig,
  SupabaseConfig,
  ConnectionStateResponse,
  TableInfo,
  ForeignKeyInfo,
  TableStats,
  ColumnInfo,
  DryRunResult,
  TableChange,
} from "./types";

// ===== Tauri Command Wrappers =====
export const tauriCommands = {
  /**
   * Test database connection without persisting
   */
  testConnection: async (config: PgConfig): Promise<ConnectionStateResponse> => {
    return invoke("test_connection", { config });
  },

  /**
   * Connect to PostgreSQL
   */
  connectPostgres: async (config: PgConfig): Promise<ConnectionStateResponse> => {
    return invoke("connect_postgres", { config });
  },

  /**
   * Disconnect from PostgreSQL
   */
  disconnectPostgres: async (): Promise<ConnectionStateResponse> => {
    return invoke("disconnect_postgres");
  },

  /**
   * Get current connection status
   */
  getConnectionStatus: async (): Promise<ConnectionStateResponse> => {
    return invoke("get_connection_status");
  },

  /**
   * Get list of tables in the database
   */
  getTables: async (): Promise<TableInfo[]> => {
    return invoke("get_tables");
  },

  /**
   * Get foreign key relationships
   */
  getForeignKeys: async (): Promise<ForeignKeyInfo[]> => {
    return invoke("get_foreign_keys");
  },

  /**
   * Get table statistics from pg_stat_user_tables (lightweight change detection)
   */
  getTableStats: async (): Promise<TableStats[]> => {
    return invoke("get_table_stats");
  },

  /**
   * Execute SQL in dry run mode (preview changes without committing)
   */
  dryRun: async (sql: string): Promise<DryRunResult> => {
    return invoke("dry_run", { sql });
  },

  /**
   * Get columns for a specific table
   */
  getColumns: async (schema: string, table: string): Promise<ColumnInfo[]> => {
    return invoke("get_columns", { schema, table });
  },

  /**
   * Get row count for a table
   */
  getRowCount: async (schema: string, table: string): Promise<number> => {
    return invoke("get_row_count", { schema, table });
  },

  /**
   * Get rows from a table
   */
  getRows: async (
    schema: string,
    table: string,
    limit?: number,
    offset?: number
  ): Promise<Record<string, unknown>[]> => {
    return invoke("get_rows", { schema, table, limit, offset });
  },

  // ===== Watcher Commands =====

  /**
   * Start watching a table for changes
   */
  startWatching: async (schema: string, table: string): Promise<void> => {
    return invoke("start_watching", { schema, table });
  },

  /**
   * Stop watching a table
   */
  stopWatching: async (schema: string, table: string): Promise<void> => {
    return invoke("stop_watching", { schema, table });
  },

  /**
   * Get list of watched tables
   */
  getWatchedTables: async (): Promise<string[]> => {
    return invoke("get_watched_tables");
  },

  /**
   * Stop all watching
   */
  stopAllWatching: async (): Promise<void> => {
    return invoke("stop_all_watching");
  },

  // ===== Supabase Commands =====

  /**
   * Test Supabase connection
   */
  testSupabaseConnection: async (config: SupabaseConfig): Promise<ConnectionStateResponse> => {
    return invoke("test_supabase_connection", { config });
  },

  /**
   * Connect to Supabase
   */
  connectSupabase: async (config: SupabaseConfig): Promise<ConnectionStateResponse> => {
    return invoke("connect_supabase", { config });
  },

  /**
   * Disconnect from Supabase
   */
  disconnectSupabase: async (): Promise<ConnectionStateResponse> => {
    return invoke("disconnect_supabase");
  },

  /**
   * Get Supabase connection status
   */
  getSupabaseStatus: async (): Promise<ConnectionStateResponse> => {
    return invoke("get_supabase_status");
  },
};

// Direct exports for convenience
export const getColumns = tauriCommands.getColumns;
export const getRows = tauriCommands.getRows;

export default tauriCommands;
