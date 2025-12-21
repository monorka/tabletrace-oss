/**
 * Hook for managing table filters
 */

import { useState, useMemo } from "react";
import { parseFilter, matchesFilter } from "@/logic/tableFilters";
import { generatePk } from "@/logic/tableKeys";

interface UseTableFiltersProps {
  allRows: Record<string, unknown>[];
  highlightedRows: Map<string, unknown>;
  effectivePkColumns: string[];
}

export function useTableFilters({
  allRows,
  highlightedRows,
  effectivePkColumns
}: UseTableFiltersProps) {
  const [filterText, setFilterText] = useState<string>("");
  const [showFilter, setShowFilter] = useState<boolean>(false);
  const [showOnlyChanged, setShowOnlyChanged] = useState<boolean>(false);

  const parsedFilters = useMemo(() => parseFilter(filterText), [filterText]);

  const filteredRows = useMemo(() => {
    return allRows.filter(row => {
      // Apply text filter first
      if (!matchesFilter(row, parsedFilters)) return false;

      // If showOnlyChanged is enabled, only show rows in highlightedRows
      if (showOnlyChanged) {
        const rowPk = generatePk(row, effectivePkColumns);
        return highlightedRows.has(rowPk);
      }

      return true;
    });
  }, [allRows, parsedFilters, showOnlyChanged, highlightedRows, effectivePkColumns]);

  return {
    filterText,
    setFilterText,
    showFilter,
    setShowFilter,
    showOnlyChanged,
    setShowOnlyChanged,
    filteredRows
  };
}

