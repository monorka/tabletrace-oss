/**
 * Library exports
 */

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
  type ChangeType,
  type TableChange,
} from "./tauri";

// Event correlation
export {
  correlateEvents,
  getUngroupedEvents,
  formatCorrelationMethod,
  formatConfidence,
  defaultCorrelationOptions,
  type CorrelatedEventGroup,
  type CorrelationMethod,
  type CorrelationOptions,
} from "./correlation";

