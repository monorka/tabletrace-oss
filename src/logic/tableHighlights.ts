/**
 * Table highlight utilities for event-based row highlighting
 * Pure functions for building highlight maps and combining rows
 */

import type { TableChange } from "../lib/tauri/types";
import { generatePk } from "./tableKeys";

// ===== Type Definitions =====
export interface RowHighlight {
  firstEventType: "INSERT" | "UPDATE" | "DELETE"; // First event in the log (oldest)
  lastEventType: "INSERT" | "UPDATE" | "DELETE";  // Last event in the log (newest)
  changedColumns: Set<string>;  // All changed columns from UPDATEs
  rowData?: Record<string, unknown>; // For displaying deleted rows
}

// ===== Pure Functions =====
/**
 * Build highlight map from events
 * Aggregates all events per PK to handle sequences like INSERT → UPDATE
 */
export function buildHighlightMap(
  events: TableChange[],
  schema: string,
  table: string,
  effectivePkColumns: string[]
): Map<string, RowHighlight> {
  const highlightedRows = new Map<string, RowHighlight>();

  try {
    // Get events for this table (newest first)
    const tableEvents = events.filter(e => e.schema === schema && e.table === table);

    // Process events in reverse order (oldest first) to build correct state
    const reversedEvents = [...tableEvents].reverse();

    reversedEvents.forEach(e => {
      const eventData = e.after || e.before;
      if (eventData && effectivePkColumns.length > 0) {
        const pk = generatePk(eventData as Record<string, unknown>, effectivePkColumns);
        if (!pk) return;

        const existing = highlightedRows.get(pk);

        if (!existing) {
          // First event for this PK (oldest in log)
          const changedColumns = new Set<string>();
          if (e.type === "UPDATE" && e.before && e.after) {
            Object.keys({ ...e.before, ...e.after }).forEach(key => {
              if (JSON.stringify(e.before?.[key]) !== JSON.stringify(e.after?.[key])) {
                changedColumns.add(key);
              }
            });
          }
          highlightedRows.set(pk, {
            firstEventType: e.type,
            lastEventType: e.type,
            changedColumns,
            rowData: e.type === "DELETE" ? e.before as Record<string, unknown> : undefined,
          });
        } else {
          // Subsequent event - update lastEventType and accumulate changes
          existing.lastEventType = e.type;

          // Accumulate changed columns from UPDATE
          if (e.type === "UPDATE" && e.before && e.after) {
            Object.keys({ ...e.before, ...e.after }).forEach(key => {
              if (JSON.stringify(e.before?.[key]) !== JSON.stringify(e.after?.[key])) {
                existing.changedColumns.add(key);
              }
            });
          }

          // Update rowData for DELETE
          if (e.type === "DELETE") {
            existing.rowData = e.before as Record<string, unknown>;
          } else {
            // If latest is not DELETE, clear rowData
            existing.rowData = undefined;
          }
        }
      }
    });
  } catch (err) {
    console.error('Error building highlight map:', err);
  }

  return highlightedRows;
}

/**
 * Build combined rows: existing rows + deleted rows from events
 * Deleted rows are shown only if latest event for that PK is DELETE
 */
export function buildCombinedRows(
  rows: Record<string, unknown>[],
  highlightedRows: Map<string, RowHighlight>,
  generatePkFn: (row: Record<string, unknown>) => string
): Record<string, unknown>[] {
  const existingPks = new Set(rows.map(row => generatePkFn(row)));
  const deletedRows: Record<string, unknown>[] = [];

  highlightedRows.forEach((highlight, pk) => {
    // If latest event is DELETE and row is not in current data, show deleted row
    if (highlight.lastEventType === "DELETE" && highlight.rowData && !existingPks.has(pk)) {
      deletedRows.push(highlight.rowData);
    }
  });

  // Combine: existing rows first, then deleted rows
  return [...rows, ...deletedRows];
}
