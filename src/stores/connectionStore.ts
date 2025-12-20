import { create } from "zustand";
import { correlateEvents, CorrelatedEventGroup, CorrelationOptions } from "../logic/correlation";
import { getMaxEvents } from "./connection/helpers";
import type { ConnectionState } from "./connection/connectionState";
import { createConnectionActions } from "./connection/connectionActions";
import { createWatchingActions } from "./watching/watchingActions";
import { createEventActions } from "./events/eventActions";
import { createTableActions } from "./tables/tableActions";
import type {
  ConnectionStatus,
  ChangeType,
  HighlightedRow,
  WatchedTableData,
  StatsChangeType,
  TableChangeInfo,
} from "./connection/types";
import type { TableChange } from "../lib/tauri/types";

// Re-export types for backward compatibility
export type {
  ConnectionStatus,
  ChangeType,
  HighlightedRow,
  WatchedTableData,
  StatsChangeType,
  TableChangeInfo,
};

// Events are kept in the log, so highlights persist while events are visible

// ===== Store Implementation =====
// This file integrates all separated action modules
export const useConnectionStore = create<ConnectionState>((set, get) => {
  // Create action modules
  const connectionActions = createConnectionActions(set, get);
  const watchingActions = createWatchingActions(set, get);
  const eventActions = createEventActions(set, get);
  const tableActions = createTableActions(set, get);

  return {
    // ===== Initial State =====
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

    // ===== Connection Management =====
    ...connectionActions,

    // ===== Schema and Table Management =====
    ...tableActions,

    // ===== Table Watching =====
    ...watchingActions,

    // ===== Event Management =====
    ...eventActions,
  };
});

// ===== Utility Functions =====
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
