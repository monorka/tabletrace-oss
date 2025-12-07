/**
 * Table List Panel Component
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { TableListPanelProps } from "../../types";
import { SchemaGroupedTables } from "./SchemaGroupedTables";

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
  onStopAllWatch
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
      className="w-56 border-r border-[var(--border-color)] bg-[var(--bg-secondary)] flex flex-col"
    >
      <div className="p-3 border-b border-[var(--border-color)] flex items-center justify-between">
        <div className="flex items-center gap-1">
          <h2 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
            Tables ({tables.length})
          </h2>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-1 hover:bg-[var(--bg-tertiary)] rounded transition-colors disabled:opacity-50"
            title="Refresh tables"
          >
            <RefreshCw className={`w-3 h-3 text-[var(--text-secondary)] ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-2">
        {tables.length === 0 ? (
          <div className="text-center py-8 text-xs text-[var(--text-secondary)]">
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
          />
        )}
      </div>
    </motion.div>
  );
}




