import type { PgConfig, SupabaseConfig, TableInfo, ColumnInfo, TableChange, ConnectionType, TableStats, ForeignKeyInfo } from "@/lib/tauri";
import { UnlistenFn } from "@tauri-apps/api/event";
import type {
  ConnectionStatus,
  WatchedTableData,
  TableChangeInfo,
} from "./types";

// ===== Store State Interface =====
export interface ConnectionState {
  // ===== Connection State =====
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

  // ===== Actions =====
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
