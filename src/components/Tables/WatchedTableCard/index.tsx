/**
 * Watched Table Card Component
 */

import { Loader2 } from "lucide-react";
import { WatchedTableCardProps } from "../../../types";
import { useWatchedTableData } from "./hooks/useWatchedTableData";
import { useTableFilters } from "./hooks/useTableFilters";
import { useColumnResize } from "./hooks/useColumnResize";
import { WatchedTableCardHeader } from "./WatchedTableCardHeader";
import { WatchedTableCardFilter } from "./WatchedTableCardFilter";
import { WatchedTableCardTable } from "./WatchedTableCardTable";
import { WatchedTableCardLegend } from "./WatchedTableCardLegend";

export function WatchedTableCard({ schema, table, data, onSelect: _onSelect }: WatchedTableCardProps) {
  // Hooks must be called unconditionally
  const columns = data?.columns || [];
  const rows = data?.rows || [];
  const rowCount = data?.rowCount || 0;
  const loading = data?.loading || false;

  // Data processing hooks
  const {
    effectivePkColumns,
    generatePk,
    highlightedRows,
    allRows,
    changedRowCount
  } = useWatchedTableData({
    schema,
    table,
    columns,
    rows
  });

  // Filter hooks
  const {
    filterText,
    setFilterText,
    showFilter,
    setShowFilter,
    showOnlyChanged,
    setShowOnlyChanged,
    filteredRows
  } = useTableFilters({
    allRows,
    highlightedRows,
    effectivePkColumns
  });

  // Column resize hook
  const { getColumnWidth, startResize } = useColumnResize();

  if (!data) {
    return (
      <div className="bg-secondary border border-border rounded-lg flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden flex flex-col">
      <WatchedTableCardHeader
        schema={schema}
        table={table}
        changedRowCount={changedRowCount}
        showOnlyChanged={showOnlyChanged}
        onToggleShowOnlyChanged={() => setShowOnlyChanged(!showOnlyChanged)}
        showFilter={showFilter}
        filterText={filterText}
        onToggleFilter={() => setShowFilter(!showFilter)}
        filteredRowCount={filteredRows.length}
        totalRowCount={rowCount}
        loading={loading}
      />

      {showFilter && (
        <WatchedTableCardFilter
          filterText={filterText}
          onFilterTextChange={setFilterText}
        />
      )}

      <div className="flex-1 overflow-auto relative">
        <WatchedTableCardTable
          columns={columns}
          filteredRows={filteredRows}
          allRows={allRows}
          highlightedRows={highlightedRows}
          effectivePkColumns={effectivePkColumns}
          generatePk={generatePk}
          getColumnWidth={getColumnWidth}
          onStartResize={startResize}
        />
      </div>

      <WatchedTableCardLegend />
    </div>
  );
}

