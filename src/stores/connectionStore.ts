import { create } from "zustand";
import { tauriCommands, listenToChanges, PgConfig, SupabaseConfig, TableInfo, ColumnInfo, TableChange, ConnectionType, TableStats, ForeignKeyInfo } from "../lib/tauri";
import { UnlistenFn } from "@tauri-apps/api/event";
import { getLimit } from "../config";
import { correlateEvents, CorrelatedEventGroup, CorrelationOptions } from "../lib/correlation";

// Helper to get max display rows from settings (user override or config default)
const getMaxDisplayRows = (): number => {
  try {
    const saved = localStorage.getItem("tabletrace-settings");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (typeof parsed.maxDisplayRows === "number" && parsed.maxDisplayRows >= 1) {
        // Respect config limit
        return Math.min(getLimit('maxPollingRows'), parsed.maxDisplayRows);
      }
    }
  } catch {
    // ignore
  }
  return getLimit('maxDisplayRows'); // default from config
};

// Get max events from config
const getMaxEvents = (): number => {
  return getLimit('maxEvents');
};

export type ConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "error";

export type ChangeType = "INSERT" | "UPDATE" | "DELETE";

// Highlighted row info
export interface HighlightedRow {
  id: string;
  pk: string;
  type: ChangeType;
  timestamp: number;
  data?: Record<string, unknown>;
}

// Table data for watched tables
export interface WatchedTableData {
  schema: string;
  table: string;
  columns: ColumnInfo[];
  rows: Record<string, unknown>[];
  rowCount: number;
  highlightedRows: Map<string, HighlightedRow>;
  loading: boolean;
}

// Table change detected via pg_stat_user_tables
export type StatsChangeType = "insert" | "update" | "delete" | "mixed";

export interface TableChangeInfo {
  schema: string;
  table: string;
  insertDelta: number;
  updateDelta: number;
  deleteDelta: number;
  totalDelta: number;
  changeType: StatsChangeType; // dominant change type for color
  detectedAt: number; // timestamp when change was detected
}

interface ConnectionState {
  // Connection state
  status: ConnectionStatus;
  connectionType: ConnectionType;
  errorMessage?: string;
  config?: PgConfig;
  supabaseConfig?: SupabaseConfig;

  // Database schema
  tables: TableInfo[];
  foreignKeys: ForeignKeyInfo[];
  watchedTables: string[];

  // Table stats for lightweight change detection
  tableStats: Map<string, TableStats>;
  tablesWithChanges: TableChangeInfo[];

  // Watched table data (schema.table -> data)
  watchedTableData: Map<string, WatchedTableData>;

  // Selected table details
  selectedTable?: { schema: string; table: string };
  selectedTableColumns: ColumnInfo[];
  selectedTableRows: Record<string, unknown>[];
  selectedTableRowCount: number;

  // Change events
  events: TableChange[];
  maxEvents: number;
  eventsPerSecond: number;

  // Event listener
  unlistenFn?: UnlistenFn;

  // Stats polling interval
  statsIntervalId?: ReturnType<typeof setInterval>;

  // Actions
  connect: (config: PgConfig) => Promise<void>;
  connectSupabase: (config: SupabaseConfig) => Promise<void>;
  disconnect: () => Promise<void>;
  testConnection: (config: PgConfig) => Promise<boolean>;
  testSupabaseConnection: (config: SupabaseConfig) => Promise<boolean>;
  refreshTables: () => Promise<void>;
  refreshTableStats: () => Promise<void>;
  startStatsPolling: () => void;
  stopStatsPolling: () => void;
  startWatching: (schema: string, table: string) => Promise<void>;
  stopWatching: (schema: string, table: string) => Promise<void>;
  refreshWatchedTable: (schema: string, table: string) => Promise<void>;
  selectTable: (schema: string, table: string) => Promise<void>;
  clearSelectedTable: () => void;
  addEvent: (event: TableChange) => void;
  clearEvents: () => void;
  setupEventListener: () => Promise<void>;
  cleanupEventListener: () => void;
  getWatchedTableData: (fullName: string) => WatchedTableData | undefined;
}

// Events are kept in the log, so highlights persist while events are visible

export const useConnectionStore = create<ConnectionState>((set, get) => ({
  // Initial state
  status: "disconnected",
  connectionType: "postgres",
  errorMessage: undefined,
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
  maxEvents: getMaxEvents(),
  eventsPerSecond: 0,
  unlistenFn: undefined,
  statsIntervalId: undefined,

  // Connect to PostgreSQL
  connect: async (config: PgConfig) => {
    set({ status: "connecting", connectionType: "postgres", errorMessage: undefined });

    try {
      const response = await tauriCommands.connectPostgres(config);

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
      const response = await tauriCommands.connectSupabase(config);

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
      const response = await tauriCommands.testConnection(config);
      return response.status === "connected";
    } catch {
      return false;
    }
  },

  // Test Supabase connection without persisting
  testSupabaseConnection: async (config: SupabaseConfig) => {
    try {
      const response = await tauriCommands.testSupabaseConnection(config);
      return response.status === "connected";
    } catch (error) {
      console.error("Supabase test connection failed:", error);
      return false;
    }
  },

  // Refresh table list
  refreshTables: async () => {
    try {
      const [tables, foreignKeys] = await Promise.all([
        tauriCommands.getTables(),
        tauriCommands.getForeignKeys(),
      ]);
      set({ tables, foreignKeys });
    } catch (error) {
      console.error("Failed to refresh tables:", error);
    }
  },

  // Refresh table stats (lightweight change detection)
  refreshTableStats: async () => {
    try {
      const stats = await tauriCommands.getTableStats();
      const { tableStats: prevStats, tablesWithChanges: existingChanges } = get();

      const now = Date.now();
      const CHANGE_RETENTION_MS = 2000; // Flash for 2 seconds

      // Filter out old changes
      const recentChanges = existingChanges.filter(c => now - c.detectedAt < CHANGE_RETENTION_MS);

      // Helper to determine dominant change type
      const getChangeType = (ins: number, upd: number, del: number): StatsChangeType => {
        if (ins > 0 && upd === 0 && del === 0) return "insert";
        if (upd > 0 && ins === 0 && del === 0) return "update";
        if (del > 0 && ins === 0 && upd === 0) return "delete";
        // Mixed - return the dominant one
        if (ins >= upd && ins >= del) return "insert";
        if (upd >= ins && upd >= del) return "update";
        return "delete";
      };

      // Compare with previous stats to detect new changes
      const newChanges: TableChangeInfo[] = [];
      const newStats = new Map<string, TableStats>();

      for (const stat of stats) {
        const key = `${stat.schema}.${stat.table}`;
        newStats.set(key, stat);

        const prev = prevStats.get(key);
        if (prev) {
          const insertDelta = stat.n_tup_ins - prev.n_tup_ins;
          const updateDelta = stat.n_tup_upd - prev.n_tup_upd;
          const deleteDelta = stat.n_tup_del - prev.n_tup_del;
          const totalDelta = insertDelta + updateDelta + deleteDelta;

          if (totalDelta > 0) {
            // Check if this table already has a recent change entry
            const existingIdx = recentChanges.findIndex(c => c.schema === stat.schema && c.table === stat.table);

            if (existingIdx >= 0) {
              // Update existing entry - refresh timestamp to extend flash
              const existing = recentChanges[existingIdx];
              const newIns = existing.insertDelta + insertDelta;
              const newUpd = existing.updateDelta + updateDelta;
              const newDel = existing.deleteDelta + deleteDelta;
              recentChanges[existingIdx] = {
                ...existing,
                insertDelta: newIns,
                updateDelta: newUpd,
                deleteDelta: newDel,
                totalDelta: existing.totalDelta + totalDelta,
                changeType: getChangeType(newIns, newUpd, newDel),
                detectedAt: now,
              };
            } else {
              // Add new change entry
              newChanges.push({
                schema: stat.schema,
                table: stat.table,
                insertDelta,
                updateDelta,
                deleteDelta,
                totalDelta,
                changeType: getChangeType(insertDelta, updateDelta, deleteDelta),
                detectedAt: now,
              });
            }
          }
        }
      }

      // Combine recent changes with new changes
      const allChanges = [...recentChanges, ...newChanges];

      set({ tableStats: newStats, tablesWithChanges: allChanges });
    } catch (error) {
      console.error("Failed to refresh table stats:", error);
    }
  },

  // Start stats polling
  startStatsPolling: () => {
    const { statsIntervalId } = get();
    if (statsIntervalId) return; // Already polling

    // Initial fetch
    get().refreshTableStats();

    // Poll every 2 seconds
    const intervalId = setInterval(() => {
      get().refreshTableStats();
    }, 2000);

    set({ statsIntervalId: intervalId });
  },

  // Stop stats polling
  stopStatsPolling: () => {
    const { statsIntervalId } = get();
    if (statsIntervalId) {
      clearInterval(statsIntervalId);
      set({ statsIntervalId: undefined, tablesWithChanges: [] });
    }
  },

  // Start watching a table
  startWatching: async (schema: string, table: string) => {
    const fullName = `${schema}.${table}`;
    const { watchedTables, watchedTableData } = get();

    if (watchedTables.includes(fullName)) {
      return; // Already watching
    }

    try {
      // Initialize table data
      const newData = new Map(watchedTableData);
      newData.set(fullName, {
        schema,
        table,
        columns: [],
        rows: [],
        rowCount: 0,
        highlightedRows: new Map(),
        loading: true,
      });
      set({ watchedTableData: newData });

      await tauriCommands.startWatching(schema, table);
      set({ watchedTables: [...watchedTables, fullName] });

      // Load initial data
      await get().refreshWatchedTable(schema, table);

      console.log(`Started watching ${fullName}`);
    } catch (error) {
      console.error(`Failed to start watching ${fullName}:`, error);
      // Remove from data on error
      const newData = new Map(get().watchedTableData);
      newData.delete(fullName);
      set({ watchedTableData: newData });
      throw error;
    }
  },

  // Stop watching a table
  stopWatching: async (schema: string, table: string) => {
    const fullName = `${schema}.${table}`;
    const { watchedTables, watchedTableData } = get();

    try {
      await tauriCommands.stopWatching(schema, table);

      // Remove from watched tables
      set({ watchedTables: watchedTables.filter((t) => t !== fullName) });

      // Remove data
      const newData = new Map(watchedTableData);
      newData.delete(fullName);
      set({ watchedTableData: newData });

      console.log(`Stopped watching ${fullName}`);
    } catch (error) {
      console.error(`Failed to stop watching ${fullName}:`, error);
    }
  },

  // Refresh watched table data
  refreshWatchedTable: async (schema: string, table: string) => {
    const fullName = `${schema}.${table}`;
    const maxRows = getMaxDisplayRows();

    try {
      const [columns, rows, rowCount] = await Promise.all([
        tauriCommands.getColumns(schema, table),
        tauriCommands.getRows(schema, table, maxRows, 0),
        tauriCommands.getRowCount(schema, table),
      ]);

      // Get current state AFTER async operations to preserve any highlights added during fetch
      const currentData = get().watchedTableData;
      const existing = currentData.get(fullName);

      const newData = new Map(currentData);
      newData.set(fullName, {
        schema,
        table,
        columns,
        rows,
        rowCount,
        highlightedRows: existing?.highlightedRows ? new Map(existing.highlightedRows) : new Map(),
        loading: false,
      });
      set({ watchedTableData: newData });
    } catch (error) {
      console.error(`Failed to refresh ${fullName}:`, error);
    }
  },

  // Select a table to view details
  selectTable: async (schema: string, table: string) => {
    set({
      selectedTable: { schema, table },
      selectedTableColumns: [],
      selectedTableRows: [],
      selectedTableRowCount: 0,
    });

    const maxRows = getMaxDisplayRows();

    try {
      const [columns, rows, rowCount] = await Promise.all([
        tauriCommands.getColumns(schema, table),
        tauriCommands.getRows(schema, table, maxRows, 0),
        tauriCommands.getRowCount(schema, table),
      ]);

      set({
        selectedTableColumns: columns,
        selectedTableRows: rows,
        selectedTableRowCount: rowCount,
      });
    } catch (error) {
      console.error("Failed to load table details:", error);
    }
  },

  // Clear selected table
  clearSelectedTable: () => {
    set({
      selectedTable: undefined,
      selectedTableColumns: [],
      selectedTableRows: [],
      selectedTableRowCount: 0,
    });
  },

  // Add a new event
  addEvent: (event: TableChange) => {
    const fullName = `${event.schema}.${event.table}`;
    const { watchedTables } = get();

    set((state) => {
      const newEvents = [event, ...state.events];
      // Keep only maxEvents
      if (newEvents.length > state.maxEvents) {
        newEvents.pop();
      }
      return { events: newEvents };
    });

    // Refresh table data if being watched
    if (watchedTables.includes(fullName)) {
      get().refreshWatchedTable(event.schema, event.table);
    }

    // Refresh selected table if it matches
    const { selectedTable } = get();
    if (selectedTable &&
        selectedTable.schema === event.schema &&
        selectedTable.table === event.table) {
      get().selectTable(event.schema, event.table);
    }
  },

  // Clear all events
  clearEvents: () => {
    set({ events: [] });
  },

  // Setup event listener for database changes
  setupEventListener: async () => {
    try {
      const unlistenFn = await listenToChanges((change) => {
        console.log("Received change:", change);
        get().addEvent(change);
      });

      set({ unlistenFn });
      console.log("Event listener setup complete");
    } catch (error) {
      console.error("Failed to setup event listener:", error);
    }
  },

  // Cleanup event listener
  cleanupEventListener: () => {
    const { unlistenFn } = get();
    if (unlistenFn) {
      unlistenFn();
      set({ unlistenFn: undefined });
      console.log("Event listener cleaned up");
    }
  },

  // Get watched table data
  getWatchedTableData: (fullName: string) => {
    return get().watchedTableData.get(fullName);
  },
}));

// Helper to get recent changes for a table
export const getRecentChangesForTable = (
  events: TableChange[],
  schema: string,
  table: string,
  limit = 10
): TableChange[] => {
  return events
    .filter((e) => e.schema === schema && e.table === table)
    .slice(0, limit);
};

/**
 * Get correlated event groups from events
 *
 * Usage:
 * ```typescript
 * const { events } = useConnectionStore();
 * const groups = getCorrelatedEvents(events);
 * ```
 */
export const getCorrelatedEvents = (
  events: TableChange[],
  options?: Partial<CorrelationOptions>
): CorrelatedEventGroup[] => {
  return correlateEvents(events, options);
};

// Re-export correlation types for convenience
export type { CorrelatedEventGroup, CorrelationOptions };
