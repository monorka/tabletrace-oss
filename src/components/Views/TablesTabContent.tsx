/**
 * Tables Tab Content Component
 */

import { motion } from "framer-motion";
import { Table2, Eye } from "lucide-react";
import { WatchedTablesGrid } from "../Tables";
import { WatchedTableData } from "../../stores/connectionStore";

export interface TablesTabContentProps {
  watchedTables: string[];
  getWatchedTableData: (fullName: string) => WatchedTableData | undefined;
  onSelectTable: (schema: string, table: string) => void;
}

export function TablesTabContent({
  watchedTables,
  getWatchedTableData,
  onSelectTable
}: TablesTabContentProps) {
  return (
    <motion.div
      key="tables"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 flex flex-col overflow-hidden"
    >
      {/* Tables Header */}
      <div className="h-12 px-4 py-2 border-b border-border bg-secondary/30 flex items-center gap-2">
        <Table2 className="w-4 h-4 text-accent-cyan" />
        <span className="text-xs font-medium">Real Time Watching Tables</span>
      </div>

      {watchedTables.length > 0 ? (
        <div className="flex-1 overflow-auto">
          <WatchedTablesGrid
            watchedTables={watchedTables}
            getWatchedTableData={getWatchedTableData}
            onSelectTable={onSelectTable}
          />
        </div>
      ) : (
        <div className="flex-1 h-full flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm mb-2">No tables being watched</p>
            <p className="text-xs">Click a table in the sidebar to start watching</p>
          </div>
        </div>
      )}
    </motion.div>
  );
}

