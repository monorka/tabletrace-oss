/**
 * Table component for WatchedTableCard
 */

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { WatchedTableCardCell } from "./WatchedTableCardCell";
import { RowHighlight } from "./utils/tableHighlights";

interface Column {
  name: string;
  is_primary_key?: boolean;
}

interface WatchedTableCardTableProps {
  columns: Column[];
  filteredRows: Record<string, unknown>[];
  allRows: Record<string, unknown>[];
  highlightedRows: Map<string, RowHighlight>;
  effectivePkColumns: string[];
  generatePk: (row: Record<string, unknown>) => string;
  getColumnWidth: (colName: string) => number;
  onStartResize: (column: string, startX: number, startWidth: number) => void;
}

export function WatchedTableCardTable({
  columns,
  filteredRows,
  allRows,
  highlightedRows,
  effectivePkColumns,
  generatePk,
  getColumnWidth,
  onStartResize
}: WatchedTableCardTableProps) {
  const [copiedCell, setCopiedCell] = useState<string | null>(null);

  if (columns.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
        Loading...
      </div>
    );
  }

  return (
    <div className="h-full">
      <Table className="text-xs w-full bg-background border-muted-foreground" style={{ minWidth: '100%' }}>
        <TableHeader className="sticky top-0 z-10 bg-secondary">
          <TableRow>
            {columns.map((col) => (
              <TableHead
                key={col.name}
                className={cn(
                  "text-muted-foreground border-b border-r border-border relative group",
                  "px-3 py-1.5"
                )}
                style={{ width: getColumnWidth(col.name), minWidth: 60 }}
              >
                <div className="flex items-center gap-1">
                  {col.is_primary_key && <span className="text-accent-purple">🔑</span>}
                  <span className="truncate">{col.name}</span>
                </div>
                {/* Resize handle */}
                <div
                  className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-accent-purple/40"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onStartResize(col.name, e.clientX, getColumnWidth(col.name));
                  }}
                />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredRows.map((row, i) => {
            const rowPk = effectivePkColumns.length > 0 ? generatePk(row) : String(i);
            const highlight = highlightedRows.get(rowPk);

            // Determine row state based on event sequence
            const isDeleted = highlight?.lastEventType === "DELETE";
            const isNewlyInserted = highlight?.firstEventType === "INSERT" && !isDeleted;
            const hasUpdates = highlight && highlight.changedColumns.size > 0;

            // Row-level highlight class
            const rowHighlightClass = isDeleted
              ? "row-delete"
              : isNewlyInserted
                ? "row-insert"
                : "";

            return (
              <TableRow
                key={rowPk}
                className={cn(
                  "border-b border-border/30",
                  rowHighlightClass,
                  isDeleted && "opacity-70"
                )}
              >
                {columns.map((col) => {
                  // Column-level highlight for changed columns
                  const isChangedColumn = !!(hasUpdates && highlight?.changedColumns.has(col.name));
                  const cellId = `${rowPk}-${col.name}`;
                  const isCopied = copiedCell === cellId;

                  return (
                    <WatchedTableCardCell
                      key={col.name}
                      value={row[col.name]}
                      isChanged={isChangedColumn}
                      isDeleted={isDeleted}
                      isCopied={isCopied}
                      width={getColumnWidth(col.name)}
                      onClick={() => {
                        const cellValue = String(row[col.name] ?? '');
                        navigator.clipboard.writeText(cellValue);
                        setCopiedCell(cellId);
                        setTimeout(() => setCopiedCell(null), 1000);
                      }}
                    />
                  );
                })}
              </TableRow>
            );
          })}
          {allRows.length === 0 && (
            <TableRow>
              <TableCell colSpan={columns.length} className="px-3 py-4 text-center text-muted-foreground">
                No data
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

