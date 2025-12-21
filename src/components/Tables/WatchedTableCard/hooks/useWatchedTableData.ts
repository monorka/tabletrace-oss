/**
 * Hook for processing watched table data and highlights
 */

import { useMemo } from "react";
import { useConnectionStore } from "@/stores/connectionStore";
import { buildHighlightMap, buildCombinedRows } from "@/logic/tableHighlights";
import { getEffectivePkColumns, generatePk } from "@/logic/tableKeys";

interface UseWatchedTableDataProps {
  schema: string;
  table: string;
  columns: Array<{ name: string; is_primary_key?: boolean }>;
  rows: Record<string, unknown>[];
}

export function useWatchedTableData({
  schema,
  table,
  columns,
  rows
}: UseWatchedTableDataProps) {
  const events = useConnectionStore((state) => state.events);

  const effectivePkColumns = useMemo(
    () => getEffectivePkColumns(columns),
    [columns]
  );

  const generatePkFn = useMemo(
    () => (row: Record<string, unknown>) => generatePk(row, effectivePkColumns),
    [effectivePkColumns]
  );

  const highlightedRows = useMemo(
    () => buildHighlightMap(events, schema, table, effectivePkColumns),
    [events, schema, table, effectivePkColumns]
  );

  const allRows = useMemo(
    () => buildCombinedRows(rows, highlightedRows, generatePkFn),
    [rows, highlightedRows, generatePkFn]
  );

  return {
    effectivePkColumns,
    generatePk: generatePkFn,
    highlightedRows,
    allRows,
    changedRowCount: highlightedRows.size
  };
}

