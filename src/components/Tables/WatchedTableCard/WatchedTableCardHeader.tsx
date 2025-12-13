/**
 * Header component for WatchedTableCard
 */

import { Table2, Loader2, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface WatchedTableCardHeaderProps {
  schema: string;
  table: string;
  changedRowCount: number;
  showOnlyChanged: boolean;
  onToggleShowOnlyChanged: () => void;
  showFilter: boolean;
  filterText: string;
  onToggleFilter: () => void;
  filteredRowCount: number;
  totalRowCount: number;
  loading: boolean;
}

export function WatchedTableCardHeader({
  schema,
  table,
  changedRowCount,
  showOnlyChanged,
  onToggleShowOnlyChanged,
  showFilter,
  filterText,
  onToggleFilter,
  filteredRowCount,
  totalRowCount,
  loading
}: WatchedTableCardHeaderProps) {
  return (
    <div className="h-9 px-3 py-1.5 border-b border-border flex items-center gap-3 bg-secondary">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <Table2 className="w-4 h-4 text-accent-purple shrink-0" />
        <span className="font-medium text-sm truncate">{table}</span>
        <span className="text-xs text-muted-foreground shrink-0">{schema}</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {/* Show only changed toggle */}
        {changedRowCount > 0 && (
          <button
            onClick={onToggleShowOnlyChanged}
            className={cn(
              "group flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium transition-all cursor-pointer",
              showOnlyChanged
                ? "bg-accent-yellow/90 text-amber-900 ring-2 ring-accent-yellow/50"
                : "bg-accent-yellow/20 text-accent-yellow hover:bg-accent-yellow/40 hover:ring-1 hover:ring-accent-yellow/30"
            )}
            title={showOnlyChanged ? "Show all rows" : "Show only changed rows"}
          >
            <span className={cn("w-2 h-2 rounded-full transition-colors", showOnlyChanged ? "bg-amber-900" : "bg-accent-yellow group-hover:animate-pulse")} />
            {changedRowCount} changed
          </button>
        )}
        {/* Filter toggle */}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onToggleFilter}
          className={cn(
            "h-auto w-auto p-1",
            (showFilter || filterText) && "text-accent-purple bg-accent-purple/10"
          )}
          title="Filter rows"
        >
          <Filter className="w-3.5 h-3.5" />
        </Button>
        <span className="text-xs text-muted-foreground">
          {showOnlyChanged || filterText ? `${filteredRowCount}/${totalRowCount.toLocaleString()}` : totalRowCount.toLocaleString()} rows
        </span>
        {loading && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
      </div>
    </div>
  );
}

