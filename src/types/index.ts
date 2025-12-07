/**
 * Shared type definitions for TableTrace
 */

import { TableChange, ColumnInfo, DryRunResult, DryRunChange, ForeignKeyInfo, TableInfo } from "../lib/tauri";
import { WatchedTableData, TableChangeInfo } from "../stores/connectionStore";

// ============================================
// App-level types
// ============================================

export type TabType = "tables" | "timeline" | "erd" | "dryrun";
export type EventLogPosition = "right" | "bottom";

export interface LayoutSettings {
  tableListOpen: boolean;
  eventLogPosition: EventLogPosition;
}

export interface AppSettings {
  maxDisplayRows: number;
}

export const defaultLayoutSettings: LayoutSettings = {
  tableListOpen: true,
  eventLogPosition: "right",
};

export const defaultAppSettings: AppSettings = {
  maxDisplayRows: 1000,
};

// ============================================
// Component Props types
// ============================================

export interface DryRunSqlPanelProps {
  sql: string;
  setSql: (sql: string) => void;
  isRunning: boolean;
  result: DryRunResult | null;
  onRun: () => void;
  isBottom?: boolean;
}

export interface ConnectedViewProps {
  activeTab: TabType;
  tables: TableInfo[];
  foreignKeys: ForeignKeyInfo[];
  watchedTables: string[];
  watchedTableData: Map<string, WatchedTableData>;
  events: TableChange[];
  tablesWithChanges: TableChangeInfo[];
  onRefreshTables: () => void;
  onStartWatch: (schema: string, table: string) => Promise<void>;
  onStopWatch: (schema: string, table: string) => Promise<void>;
  onSelectTable: (schema: string, table: string) => void;
  selectedTable?: { schema: string; table: string };
  selectedTableColumns: ColumnInfo[];
  selectedTableRows: Record<string, unknown>[];
  selectedTableRowCount: number;
  getChangesForTable: (schema: string, table: string) => TableChange[];
  getWatchedTableData: (fullName: string) => WatchedTableData | undefined;
  onClearEvents: () => void;
  layoutSettings: LayoutSettings;
  onStopAllWatch: () => void;
}

export interface WatchedTablesGridProps {
  watchedTables: string[];
  getWatchedTableData: (fullName: string) => WatchedTableData | undefined;
  onSelectTable: (schema: string, table: string) => void;
}

export interface DryRunTablesGridProps {
  watchedTables: string[];
  getWatchedTableData: (fullName: string) => WatchedTableData | undefined;
  getDryRunChangesForTable: (schema: string, table: string) => DryRunChange[];
}

export interface DryRunTableCardProps {
  schema: string;
  table: string;
  data?: WatchedTableData;
  dryRunChanges: DryRunChange[];
}

export interface WatchedTableCardProps {
  schema: string;
  table: string;
  data?: WatchedTableData;
  onSelect: () => void;
}

export interface TableListPanelProps {
  tables: TableInfo[];
  watchedTables: string[];
  selectedTable?: { schema: string; table: string };
  tablesWithChanges: TableChangeInfo[];
  getChangesForTable: (schema: string, table: string) => TableChange[];
  onSelectTable: (schema: string, table: string) => void;
  onStartWatch: (schema: string, table: string) => Promise<void>;
  onStopWatch: (schema: string, table: string) => Promise<void>;
  onRefreshTables: () => void;
  onStopAllWatch: () => void;
}

export interface SchemaGroupedTablesProps {
  tables: TableInfo[];
  watchedTables: string[];
  selectedTable?: { schema: string; table: string };
  tablesWithChanges: TableChangeInfo[];
  getChangesForTable: (schema: string, table: string) => TableChange[];
  onSelectTable: (schema: string, table: string) => void;
  onStartWatch: (schema: string, table: string) => Promise<void>;
  onStopWatch: (schema: string, table: string) => Promise<void>;
  onStopAllWatch: () => void;
}

export interface TableListItemProps {
  schema: string;
  name: string;
  columnCount: number;
  isWatched: boolean;
  isSelected: boolean;
  changes: number;
  statsChange?: TableChangeInfo;
  onSelect: () => void;
  onToggleWatch: () => void;
}

export interface DiffResult {
  key: string;
  before: unknown;
  after: unknown;
  changed: boolean;
  type: "added" | "removed" | "modified" | "unchanged";
}

export interface EventLogContentProps {
  events: TableChange[];
  expandedEventIds: Set<string>;
  onToggleExpanded: (eventId: string) => void;
}

export interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
}

// ============================================
// ERD types
// ============================================

export interface TableNodeData extends Record<string, unknown> {
  label: string;
  schema: string;
  table: string;
  columns: { name: string; type: string; isPrimaryKey: boolean }[];
  isWatched: boolean;
  isHighlighted?: boolean;
}

export interface CardinalityEdgeData extends Record<string, unknown> {
  sourceId: string;
  targetId: string;
  fkColumn: string;
  isHighlighted?: boolean;
}

export interface ERDHoveredTable {
  fullName: string;
  schema: string;
  table: string;
  columns: { name: string; type: string; isPrimaryKey: boolean }[];
  outgoingFKs: ForeignKeyInfo[];  // This table references others
  incomingFKs: ForeignKeyInfo[];  // Other tables reference this
}

export interface ERDViewProps {
  tables: TableInfo[];
  foreignKeys: ForeignKeyInfo[];
  watchedTables: string[];
  onHoveredTableChange?: (table: ERDHoveredTable | null) => void;
}

// ============================================
// Timeline types
// ============================================

export interface TimelineViewProps {
  events: TableChange[];
  onClearEvents: () => void;
}

// ============================================
// ERD Constants
// ============================================

export const NODE_WIDTH = 260;

