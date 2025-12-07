/**
 * Dry Run Table Card Component
 */

import React, { useState } from "react";
import { Table2, Loader2, Filter, X } from "lucide-react";
import { DryRunTableCardProps } from "../../types";
import { DryRunChange } from "../../lib/tauri";
import { formatCellValue } from "../../utils";

export function DryRunTableCard({ schema, table, data, dryRunChanges }: DryRunTableCardProps) {
  // Column widths state for resizing
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [resizing, setResizing] = useState<{ column: string; startX: number; startWidth: number } | null>(null);
  const [copiedCell, setCopiedCell] = useState<string | null>(null);

  // Filter state
  const [filterText, setFilterText] = useState<string>("");
  const [showFilter, setShowFilter] = useState<boolean>(false);
  const [showOnlyChanged, setShowOnlyChanged] = useState<boolean>(false);

  // Default column width (same as WatchedTableCard)
  const DEFAULT_COLUMN_WIDTH = 120;

  // Add global listeners when resizing
  React.useEffect(() => {
    if (!resizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const diff = e.clientX - resizing.startX;
      const newWidth = Math.max(60, resizing.startWidth + diff);
      setColumnWidths(prev => ({ ...prev, [resizing.column]: newWidth }));
    };

    const handleMouseUp = () => {
      setResizing(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizing]);

  if (!data) {
    return (
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--text-secondary)]" />
      </div>
    );
  }

  const { columns, rows, rowCount, loading } = data;

  // Get column width
  const getColumnWidth = (colName: string) => columnWidths[colName] || DEFAULT_COLUMN_WIDTH;

  // Get ALL primary key columns for row identification
  const pkColumns = columns?.filter(c => c.is_primary_key).map(c => c.name) || [];
  const effectivePkColumns = pkColumns.length > 0 ? pkColumns : (columns?.[0]?.name ? [columns[0].name] : []);

  // Helper to generate PK string
  const generatePk = (rowData: Record<string, unknown> | undefined | null): string => {
    if (!rowData || effectivePkColumns.length === 0) return '';
    try {
      return effectivePkColumns
        .map(col => String(rowData[col] ?? ''))
        .join('::');
    } catch {
      return '';
    }
  };

  // Build highlight map from dry run changes
  const highlightedRows = new Map<string, {
    type: "INSERT" | "UPDATE" | "DELETE";
    changedColumns: Set<string>;
    newData?: Record<string, unknown>;
    oldData?: Record<string, unknown>;
  }>();

  dryRunChanges.forEach((change: DryRunChange) => {
    const eventData = change.after || change.before;
    if (eventData && effectivePkColumns.length > 0) {
      const pk = generatePk(eventData as Record<string, unknown>);
      if (!pk) return;

      const changedColumns = new Set<string>();
      if (change.type === "UPDATE" && change.before && change.after) {
        Object.keys({ ...change.before, ...change.after }).forEach(key => {
          if (JSON.stringify(change.before?.[key]) !== JSON.stringify(change.after?.[key])) {
            changedColumns.add(key);
          }
        });
      }

      highlightedRows.set(pk, {
        type: change.type,
        changedColumns,
        newData: change.after as Record<string, unknown> | undefined,
        oldData: change.before as Record<string, unknown> | undefined,
      });
    }
  });

  // Build combined rows: existing rows + deleted rows from dry run
  const existingPks = new Set(rows.map(row => generatePk(row)));
  const deletedRows: Record<string, unknown>[] = [];

  highlightedRows.forEach((highlight, pk) => {
    if (highlight.type === "DELETE" && highlight.oldData && !existingPks.has(pk)) {
      deletedRows.push(highlight.oldData);
    }
  });

  const allRows = [...rows, ...deletedRows];

  // Parse filter
  const parseFilter = (text: string): Array<{ column: string; value: string; operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'contains' }> => {
    if (!text.trim()) return [];

    const filters: Array<{ column: string; value: string; operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'contains' }> = [];
    const parts = text.split(',').map(p => p.trim()).filter(p => p);

    for (const part of parts) {
      let match = part.match(/^(\w+)\s*(!=|>=|<=|>|<|=)\s*(.+)$/);
      if (match) {
        filters.push({
          column: match[1],
          value: match[3].trim(),
          operator: match[2] as '=' | '!=' | '>' | '<' | '>=' | '<='
        });
      } else {
        match = part.match(/^(\w+)\s*~\s*(.+)$/);
        if (match) {
          filters.push({ column: match[1], value: match[2].trim(), operator: 'contains' });
        }
      }
    }
    return filters;
  };

  const matchesFilter = (row: Record<string, unknown>, filters: ReturnType<typeof parseFilter>): boolean => {
    if (filters.length === 0) return true;

    return filters.every(filter => {
      const cellValue = row[filter.column];
      if (cellValue === undefined) return false;

      const cellStr = String(cellValue).toLowerCase();
      const filterVal = filter.value.toLowerCase();

      switch (filter.operator) {
        case '=':
          return cellStr === filterVal || String(cellValue) === filter.value;
        case '!=':
          return cellStr !== filterVal && String(cellValue) !== filter.value;
        case '>':
          return Number(cellValue) > Number(filter.value);
        case '<':
          return Number(cellValue) < Number(filter.value);
        case '>=':
          return Number(cellValue) >= Number(filter.value);
        case '<=':
          return Number(cellValue) <= Number(filter.value);
        case 'contains':
          return cellStr.includes(filterVal);
        default:
          return true;
      }
    });
  };

  const parsedFilters = parseFilter(filterText);

  // Filter rows
  const filteredRows = allRows.filter(row => {
    if (!matchesFilter(row, parsedFilters)) return false;
    if (showOnlyChanged) {
      const rowPk = generatePk(row);
      return highlightedRows.has(rowPk);
    }
    return true;
  });

  const changedRowCount = highlightedRows.size;

  return (
    <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-4 py-2 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-tertiary)]">
        <div className="flex items-center gap-2">
          <Table2 className="w-4 h-4 text-[var(--accent-cyan)]" />
          <span className="font-medium text-sm">{table}</span>
          <span className="text-xs text-[var(--text-secondary)]">{schema}</span>
          {dryRunChanges.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--accent-cyan)]/20 text-[var(--accent-cyan)]">
              Dry Run Preview
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {changedRowCount > 0 && (
            <button
              onClick={() => setShowOnlyChanged(!showOnlyChanged)}
              className={`group flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium transition-all cursor-pointer ${
                showOnlyChanged
                  ? 'bg-[var(--accent-yellow)] text-black ring-2 ring-[var(--accent-yellow)]/50'
                  : 'bg-[var(--accent-yellow)]/20 text-[var(--accent-yellow)] hover:bg-[var(--accent-yellow)]/40'
              }`}
              title={showOnlyChanged ? "Show all rows" : "Show only changed rows"}
            >
              <span className={`w-2 h-2 rounded-full transition-colors ${showOnlyChanged ? 'bg-black' : 'bg-[var(--accent-yellow)]'}`} />
              {changedRowCount} changed
            </button>
          )}
          <button
            onClick={() => setShowFilter(!showFilter)}
            className={`p-1 rounded transition-colors ${showFilter || filterText ? 'text-[var(--accent-purple)] bg-[var(--accent-purple)]/10' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
            title="Filter rows"
          >
            <Filter className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs text-[var(--text-secondary)]">
            {showOnlyChanged || filterText ? `${filteredRows.length}/${rowCount.toLocaleString()}` : rowCount.toLocaleString()} rows
          </span>
          {loading && <Loader2 className="w-3 h-3 animate-spin text-[var(--text-secondary)]" />}
        </div>
      </div>

      {/* Filter input */}
      {showFilter && (
        <div className="px-4 py-2 border-b border-[var(--border-color)] bg-[var(--bg-primary)]">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="col=val, col!=val, col>10, col~text"
              className="flex-1 text-xs px-2 py-1.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded focus:outline-none focus:border-[var(--accent-purple)]"
            />
            {filterText && (
              <button onClick={() => setFilterText("")} className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-auto relative">
        {columns.length === 0 ? (
          <div className="h-full flex items-center justify-center text-[var(--text-secondary)] text-sm">
            Loading...
          </div>
        ) : (
          <div className="overflow-x-auto h-full">
            <table className="text-xs border-collapse" style={{ minWidth: 'max-content' }}>
              <thead className="bg-[var(--bg-primary)] sticky top-0 z-10">
                <tr>
                  {columns.map((col) => (
                    <th
                      key={col.name}
                      className="text-left font-medium text-[var(--text-secondary)] border-b border-r border-[var(--border-color)]/30 whitespace-nowrap relative group bg-[var(--bg-tertiary)]"
                      style={{ width: getColumnWidth(col.name), minWidth: 60 }}
                    >
                      <div className="px-3 py-1.5 flex items-center gap-1">
                        {col.is_primary_key && <span className="text-[var(--accent-purple)]">🔑</span>}
                        <span className="truncate">{col.name}</span>
                      </div>
                      <div
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-[var(--accent-purple)]/40"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setResizing({ column: col.name, startX: e.clientX, startWidth: getColumnWidth(col.name) });
                        }}
                      />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row, i) => {
                  const rowPk = effectivePkColumns.length > 0 ? generatePk(row) : String(i);
                  const highlight = highlightedRows.get(rowPk);

                  const isDeleted = highlight?.type === "DELETE";
                  const isInserted = highlight?.type === "INSERT";
                  const isUpdated = highlight?.type === "UPDATE";

                  const rowHighlightClass = isDeleted
                    ? "row-delete"
                    : isInserted
                      ? "row-insert"
                      : "";

                  return (
                    <tr
                      key={rowPk}
                      className={`border-b border-[var(--border-color)]/30 hover:bg-[var(--bg-tertiary)]/50 ${rowHighlightClass} ${isDeleted ? 'opacity-70' : ''}`}
                    >
                      {columns.map((col) => {
                        const isChangedColumn = isUpdated && highlight?.changedColumns.has(col.name);
                        const cellId = `${rowPk}-${col.name}`;
                        const cellValue = String(row[col.name] ?? '');

                        return (
                          <td
                            key={col.name}
                            className={`px-3 py-1.5 border-b border-r border-[var(--border-color)]/30 cursor-pointer hover:bg-[var(--bg-tertiary)] ${
                              isChangedColumn && !isDeleted ? 'bg-[var(--accent-yellow)]/30 text-[var(--accent-yellow)]' : ''
                            } ${copiedCell === cellId ? 'bg-[var(--accent-green)]/20' : ''}`}
                            style={{ width: getColumnWidth(col.name), minWidth: 60, maxWidth: getColumnWidth(col.name) }}
                            onClick={() => {
                              navigator.clipboard.writeText(cellValue);
                              setCopiedCell(cellId);
                              setTimeout(() => setCopiedCell(null), 1000);
                            }}
                            title="Click to copy"
                          >
                            <div className={`truncate ${isDeleted ? 'line-through' : ''}`}>
                              {copiedCell === cellId ? (
                                <span className="text-[var(--accent-green)] text-[10px]">Copied!</span>
                              ) : (
                                formatCellValue(row[col.name])
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
                {allRows.length === 0 && (
                  <tr>
                    <td colSpan={columns.length} className="px-3 py-4 text-center text-[var(--text-secondary)]">
                      No data
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="px-3 py-1.5 border-t border-[var(--border-color)] flex items-center gap-3 text-[10px] text-[var(--text-secondary)]">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm bg-[var(--accent-green)]"></span> INSERT
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm bg-[var(--accent-yellow)]"></span> UPDATE
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm bg-[var(--accent-red)]"></span> DELETE
        </span>
      </div>
    </div>
  );
}

