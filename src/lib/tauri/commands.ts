import { invoke } from "@tauri-apps/api/core";

// ===== Tauri Command Wrappers =====
// Using DTOs for type safety
import type {
  TestConnectionInput,
  TestConnectionOutput,
  ConnectPostgresInput,
  ConnectPostgresOutput,
  TestSupabaseConnectionInput,
  TestSupabaseConnectionOutput,
  ConnectSupabaseInput,
  ConnectSupabaseOutput,
  GetColumnsInput,
  GetColumnsOutput,
  GetRowCountInput,
  GetRowCountOutput,
  GetRowsInput,
  GetRowsOutput,
  DryRunInput,
  DryRunOutput,
  StartWatchingInput,
  StopWatchingInput,
  GetTablesOutput,
  GetForeignKeysOutput,
  GetTableStatsOutput,
  GetConnectionStatusOutput,
  DisconnectPostgresOutput,
  GetSupabaseStatusOutput,
  DisconnectSupabaseOutput,
  GetWatchedTablesOutput,
} from "./dto";

export const tauriCommands = {
  /**
   * Test database connection without persisting
   */
  testConnection: async (input: TestConnectionInput): Promise<TestConnectionOutput> => {
    return invoke("test_connection", input as unknown as Record<string, unknown>);
  },

  /**
   * Connect to PostgreSQL
   */
  connectPostgres: async (input: ConnectPostgresInput): Promise<ConnectPostgresOutput> => {
    return invoke("connect_postgres", input as unknown as Record<string, unknown>);
  },

  /**
   * Disconnect from PostgreSQL
   */
  disconnectPostgres: async (): Promise<DisconnectPostgresOutput> => {
    return invoke("disconnect_postgres");
  },

  /**
   * Get current connection status
   */
  getConnectionStatus: async (): Promise<GetConnectionStatusOutput> => {
    return invoke("get_connection_status");
  },

  /**
   * Get list of tables in the database
   */
  getTables: async (): Promise<GetTablesOutput> => {
    return invoke("get_tables");
  },

  /**
   * Get foreign key relationships
   */
  getForeignKeys: async (): Promise<GetForeignKeysOutput> => {
    return invoke("get_foreign_keys");
  },

  /**
   * Get table statistics from pg_stat_user_tables (lightweight change detection)
   */
  getTableStats: async (): Promise<GetTableStatsOutput> => {
    return invoke("get_table_stats");
  },

  /**
   * Execute SQL in dry run mode (preview changes without committing)
   */
  dryRun: async (input: DryRunInput): Promise<DryRunOutput> => {
    return invoke("dry_run", input as unknown as Record<string, unknown>);
  },

  /**
   * Get columns for a specific table
   */
  getColumns: async (input: GetColumnsInput): Promise<GetColumnsOutput> => {
    return invoke("get_columns", input as unknown as Record<string, unknown>);
  },

  /**
   * Get row count for a table
   */
  getRowCount: async (input: GetRowCountInput): Promise<GetRowCountOutput> => {
    return invoke("get_row_count", input as unknown as Record<string, unknown>);
  },

  /**
   * Get rows from a table
   */
  getRows: async (input: GetRowsInput): Promise<GetRowsOutput> => {
    return invoke("get_rows", input as unknown as Record<string, unknown>);
  },

  // ===== Watcher Commands =====

  /**
   * Start watching a table for changes
   */
  startWatching: async (input: StartWatchingInput): Promise<void> => {
    return invoke("start_watching", input as unknown as Record<string, unknown>);
  },

  /**
   * Stop watching a table
   */
  stopWatching: async (input: StopWatchingInput): Promise<void> => {
    return invoke("stop_watching", input as unknown as Record<string, unknown>);
  },

  /**
   * Get list of watched tables
   */
  getWatchedTables: async (): Promise<GetWatchedTablesOutput> => {
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
  testSupabaseConnection: async (input: TestSupabaseConnectionInput): Promise<TestSupabaseConnectionOutput> => {
    return invoke("test_supabase_connection", input as unknown as Record<string, unknown>);
  },

  /**
   * Connect to Supabase
   */
  connectSupabase: async (input: ConnectSupabaseInput): Promise<ConnectSupabaseOutput> => {
    return invoke("connect_supabase", input as unknown as Record<string, unknown>);
  },

  /**
   * Disconnect from Supabase
   */
  disconnectSupabase: async (): Promise<DisconnectSupabaseOutput> => {
    return invoke("disconnect_supabase");
  },

  /**
   * Get Supabase connection status
   */
  getSupabaseStatus: async (): Promise<GetSupabaseStatusOutput> => {
    return invoke("get_supabase_status");
  },
};

// Helper functions for backward compatibility (using DTOs internally)
export const getColumns = (schema: string, table: string) =>
  tauriCommands.getColumns({ schema, table });
export const getRows = (schema: string, table: string, limit?: number, offset?: number) =>
  tauriCommands.getRows({ schema, table, limit, offset });

export default tauriCommands;
