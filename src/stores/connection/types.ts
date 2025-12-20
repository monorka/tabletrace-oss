import { ColumnInfo, TableChange, ConnectionType } from "../../lib/tauri";

// ===== Type Definitions =====
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
