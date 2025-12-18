/**
 * TableTrace - Main exports
 */

// Configuration
export {
  config,
  getConfig,
  updateConfig,
  getLimit,
  defaultConfig,
  type TableTraceConfig,
} from "./config";

// Stores
export {
  useConnectionStore,
  useUIStore,
  getRecentChangesForTable,
  getCorrelatedEvents,
  type WatchedTableData,
  type ConnectionStatus,
  type ChangeType,
  type HighlightedRow,
  type LayoutSettings,
  type AppSettings,
  type EventLogPosition,
  type CorrelatedEventGroup,
  type CorrelationOptions,
} from "./stores";

// Components
export {
  ConnectionDialog,
} from "./components";

// Tauri commands and types
export {
  tauriCommands,
  listenToChanges,
  type PgConfig,
  type SupabaseConfig,
  type ConnectionType,
  type ConnectionStateResponse,
  type TableInfo,
  type ColumnInfo,
  type ForeignKeyInfo,
  type TableChange,
} from "./lib";

// Version
export const VERSION = "0.2.0";
