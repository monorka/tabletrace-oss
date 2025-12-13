/**
 * Table List Panel Component
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { TableListPanelProps } from "../../types";
import { SchemaGroupedTables } from "./SchemaGroupedTables";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";

export function TableListPanel({
  tables,
  watchedTables,
  selectedTable,
  tablesWithChanges,
  getChangesForTable,
  onSelectTable,
  onStartWatch,
  onStopWatch,
  onRefreshTables,
  onStopAllWatch,
  activeTab,
  dryRunTargetTable,
  onSetDryRunTarget
}: TableListPanelProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefreshTables();
    // Keep spinning for at least 500ms for visual feedback
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return (
    <motion.div
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 224, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="w-56 border-r border-border bg-background flex flex-col"
    >
      <div className="h-12 p-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-1">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Tables ({tables.length})
          </h2>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-auto w-auto p-1"
            title="Refresh tables"
          >
            <RefreshCw className={cn("w-3 h-3", isRefreshing && "animate-spin")} />
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-2 gap-2">
        {tables.length === 0 ? (
          <div className="text-center py-8 text-xs text-muted-foreground">
            No tables found
          </div>
        ) : (
          <SchemaGroupedTables
            tables={tables}
            watchedTables={watchedTables}
            selectedTable={selectedTable}
            tablesWithChanges={tablesWithChanges}
            getChangesForTable={getChangesForTable}
            onSelectTable={onSelectTable}
            onStartWatch={onStartWatch}
            onStopWatch={onStopWatch}
            onStopAllWatch={onStopAllWatch}
            activeTab={activeTab}
            dryRunTargetTable={dryRunTargetTable}
            onSetDryRunTarget={onSetDryRunTarget}
          />
        )}
      </div>
    </motion.div>
  );
}




