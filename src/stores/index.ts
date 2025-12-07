/**
 * Store exports
 */

// Connection store - database connection, tables, events
export {
  useConnectionStore,
  getRecentChangesForTable,
  getCorrelatedEvents,
  type WatchedTableData,
  type ConnectionStatus,
  type ChangeType,
  type HighlightedRow,
  type CorrelatedEventGroup,
  type CorrelationOptions,
} from "./connectionStore";

// UI store - layout and appearance settings
export {
  useUIStore,
  type LayoutSettings,
  type AppSettings,
  type EventLogPosition,
} from "./uiStore";

