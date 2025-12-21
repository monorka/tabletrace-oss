// ===== DTOs (Data Transfer Objects) =====
// Input/Output types for Tauri commands
// These types match the Rust DTOs in src-tauri/src/shared/dto.rs

import type {
  PgConfig,
  SupabaseConfig,
  ConnectionStateResponse,
  TableInfo,
  ColumnInfo,
  ForeignKeyInfo,
  TableStats,
  DryRunResult,
} from "./types";

// ===== Connection DTOs =====

export interface TestConnectionInput {
  config: PgConfig;
}

export interface ConnectPostgresInput {
  config: PgConfig;
}

export interface TestSupabaseConnectionInput {
  config: SupabaseConfig;
}

export interface ConnectSupabaseInput {
  config: SupabaseConfig;
}

// ===== Schema DTOs =====

export interface GetColumnsInput {
  schema: string;
  table: string;
}

export interface GetRowCountInput {
  schema: string;
  table: string;
}

export interface GetRowsInput {
  schema: string;
  table: string;
  limit?: number;
  offset?: number;
}

export interface DryRunInput {
  sql: string;
}

// ===== Watching DTOs =====

export interface StartWatchingInput {
  schema: string;
  table: string;
}

export interface StopWatchingInput {
  schema: string;
  table: string;
}

// ===== Output Types =====
// (Most commands return types already defined in types.ts)

export type ConnectPostgresOutput = ConnectionStateResponse;
export type DisconnectPostgresOutput = ConnectionStateResponse;
export type GetConnectionStatusOutput = ConnectionStateResponse;
export type TestConnectionOutput = ConnectionStateResponse;
export type ConnectSupabaseOutput = ConnectionStateResponse;
export type DisconnectSupabaseOutput = ConnectionStateResponse;
export type GetSupabaseStatusOutput = ConnectionStateResponse;
export type TestSupabaseConnectionOutput = ConnectionStateResponse;

export type GetTablesOutput = TableInfo[];
export type GetForeignKeysOutput = ForeignKeyInfo[];
export type GetTableStatsOutput = TableStats[];
export type GetColumnsOutput = ColumnInfo[];
export type GetRowCountOutput = number;
export type GetRowsOutput = Array<Record<string, unknown>>;
export type DryRunOutput = DryRunResult;

export type GetWatchedTablesOutput = string[];
