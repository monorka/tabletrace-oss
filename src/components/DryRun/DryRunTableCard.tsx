/**
 * Dry Run Table Card Component
 */

import React, { useState } from "react";
import { Table2, Loader2, Filter, X } from "lucide-react";
import { DryRunTableCardProps } from "../../types";
import { DryRunChange } from "../../lib/tauri";
import { formatCellValue } from "../../utils";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { cn } from "../../lib/utils";

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
      <div className="bg-secondary border border-border rounded-lg flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
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
    <div className="bg-secondary border border-border rounded-lg overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-4 py-2 border-b border-border flex items-center justify-between bg-muted">
        <div className="flex items-center gap-2">
          <Table2 className="w-4 h-4 text-accent-cyan" />
          <span className="font-medium text-sm">{table}</span>
          <span className="text-xs text-muted-foreground">{schema}</span>
          {dryRunChanges.length > 0 && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 bg-accent-cyan/20 text-accent-cyan border-accent-cyan/30">
              Dry Run Preview
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3">
          {changedRowCount > 0 && (
            <Button
              onClick={() => setShowOnlyChanged(!showOnlyChanged)}
              variant="ghost"
              size="sm"
              className={cn(
                "group flex items-center gap-1 px-1.5 py-0.5 h-auto text-[10px] font-medium",
                showOnlyChanged
                  ? "bg-accent-yellow text-black ring-2 ring-accent-yellow/50 hover:bg-accent-yellow"
                  : "bg-accent-yellow/20 text-accent-yellow hover:bg-accent-yellow/40"
              )}
              title={showOnlyChanged ? "Show all rows" : "Show only changed rows"}
            >
              <span className={cn("w-2 h-2 rounded-full transition-colors", showOnlyChanged ? "bg-black" : "bg-accent-yellow")} />
              {changedRowCount} changed
            </Button>
          )}
          <Button
            onClick={() => setShowFilter(!showFilter)}
            variant="ghost"
            size="icon"
            className={cn(
              "h-auto w-auto p-1",
              showFilter || filterText ? "text-accent-purple bg-accent-purple/10" : "text-muted-foreground hover:text-foreground"
            )}
            title="Filter rows"
          >
            <Filter className="w-3.5 h-3.5" />
          </Button>
          <span className="text-xs text-muted-foreground">
            {showOnlyChanged || filterText ? `${filteredRows.length}/${rowCount.toLocaleString()}` : rowCount.toLocaleString()} rows
          </span>
          {loading && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
        </div>
      </div>

      {/* Filter input */}
      {showFilter && (
        <div className="px-4 py-2 border-b border-border bg-background">
          <div className="flex items-center gap-2">
            <Input
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="col=val, col!=val, col>10, col~text"
              className="flex-1 text-xs h-auto px-2 py-1.5"
            />
            {filterText && (
              <Button
                onClick={() => setFilterText("")}
                variant="ghost"
                size="icon"
                className="h-auto w-auto p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-auto relative">
        {columns.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
            Loading...
          </div>
        ) : (
          <div className="overflow-x-auto h-full">
            <table className="text-xs border-collapse" style={{ minWidth: 'max-content' }}>
              <thead className="bg-background sticky top-0 z-10">
                <tr>
                  {columns.map((col) => (
                    <th
                      key={col.name}
                      className="text-left font-medium text-muted-foreground border-b border-r border-border/30 whitespace-nowrap relative group bg-muted"
                      style={{ width: getColumnWidth(col.name), minWidth: 60 }}
                    >
                      <div className="px-3 py-1.5 flex items-center gap-1">
                        {col.is_primary_key && <span className="text-accent-purple">🔑</span>}
                        <span className="truncate">{col.name}</span>
                      </div>
                      <div
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-accent-purple/40"
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
                      className={cn(
                        "border-b border-border/30 hover:bg-muted/50",
                        rowHighlightClass,
                        isDeleted && "opacity-70"
                      )}
                    >
                      {columns.map((col) => {
                        const isChangedColumn = isUpdated && highlight?.changedColumns.has(col.name);
                        const cellId = `${rowPk}-${col.name}`;
                        const cellValue = String(row[col.name] ?? '');

                        return (
                          <td
                            key={col.name}
                            className={cn(
                              "px-3 py-1.5 border-b border-r border-border/30 cursor-pointer hover:bg-muted",
                              isChangedColumn && !isDeleted && "bg-accent-yellow/30 text-accent-yellow",
                              copiedCell === cellId && "bg-accent-green/20"
                            )}
                            style={{ width: getColumnWidth(col.name), minWidth: 60, maxWidth: getColumnWidth(col.name) }}
                            onClick={() => {
                              navigator.clipboard.writeText(cellValue);
                              setCopiedCell(cellId);
                              setTimeout(() => setCopiedCell(null), 1000);
                            }}
                            title="Click to copy"
                          >
                            <div className={cn("truncate", isDeleted && "line-through")}>
                              {copiedCell === cellId ? (
                                <span className="text-accent-green text-[10px]">Copied!</span>
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
                    <td colSpan={columns.length} className="px-3 py-4 text-center text-muted-foreground">
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
      <div className="px-3 py-1.5 border-t border-border flex items-center gap-3 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm bg-accent-green"></span> INSERT
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm bg-accent-yellow"></span> UPDATE
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm bg-accent-red"></span> DELETE
        </span>
      </div>
    </div>
  );
}

