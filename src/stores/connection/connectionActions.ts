import { tauriCommands, type PgConfig, type SupabaseConfig } from "@/lib/tauri";
import type { ConnectionState } from "./connectionState";

// ===== Connection Actions =====
// Connection management actions extracted from connectionStore

export const createConnectionActions = (
  set: (partial: Partial<ConnectionState> | ((state: ConnectionState) => Partial<ConnectionState>)) => void,
  get: () => ConnectionState
) => ({
  // Connect to PostgreSQL
  connect: async (config: PgConfig) => {
    set({ status: "connecting", connectionType: "postgres", errorMessage: undefined });

    try {
      const response = await tauriCommands.connectPostgres({ config });

      if (response.status === "connected") {
        set({ status: "connected", connectionType: "postgres", config });
        // Auto-refresh tables after connection
        await get().refreshTables();
        // Setup event listener
        await get().setupEventListener();
        // Start stats polling for lightweight change detection
        get().startStatsPolling();
      } else {
        set({
          status: "error",
          errorMessage: response.message || "Connection failed"
        });
      }
    } catch (error) {
      set({
        status: "error",
        errorMessage: error instanceof Error ? error.message : String(error)
      });
    }
  },

  // Connect to Supabase
  connectSupabase: async (config: SupabaseConfig) => {
    set({ status: "connecting", connectionType: "supabase", errorMessage: undefined });

    try {
      const response = await tauriCommands.connectSupabase({ config });

      if (response.status === "connected") {
        set({ status: "connected", connectionType: "supabase", supabaseConfig: config });
        // Setup event listener
        await get().setupEventListener();
      } else {
        set({
          status: "error",
          errorMessage: response.message || "Connection failed"
        });
      }
    } catch (error) {
      set({
        status: "error",
        errorMessage: error instanceof Error ? error.message : String(error)
      });
    }
  },

  // Disconnect from database
  disconnect: async () => {
    const { connectionType } = get();

    try {
      // Cleanup event listener
      get().cleanupEventListener();
      // Stop stats polling
      get().stopStatsPolling();

      if (connectionType === "supabase") {
        await tauriCommands.disconnectSupabase();
      } else {
        await tauriCommands.disconnectPostgres();
      }

      set({
        status: "disconnected",
        connectionType: "postgres",
        config: undefined,
        supabaseConfig: undefined,
        tables: [],
        foreignKeys: [],
        watchedTables: [],
        tableStats: new Map(),
        tablesWithChanges: [],
        watchedTableData: new Map(),
        selectedTable: undefined,
        selectedTableColumns: [],
        selectedTableRows: [],
        selectedTableRowCount: 0,
        events: [],
        errorMessage: undefined,
      });
    } catch (error) {
      console.error("Disconnect error:", error);
    }
  },

  // Test PostgreSQL connection without persisting
  testConnection: async (config: PgConfig) => {
    try {
      const response = await tauriCommands.testConnection({ config });
      return response.status === "connected";
    } catch {
      return false;
    }
  },

  // Test Supabase connection without persisting
  testSupabaseConnection: async (config: SupabaseConfig) => {
    try {
      const response = await tauriCommands.testSupabaseConnection({ config });
      return response.status === "connected";
    } catch (error) {
      console.error("Supabase test connection failed:", error);
      return false;
    }
  },
});
