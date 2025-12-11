/**
 * Dry Run Tab Content Component
 */

import { motion } from "framer-motion";
import { FlaskConical, Eye } from "lucide-react";
import { DryRunTablesGrid } from "../DryRun";
import { WatchedTableData } from "../../stores/connectionStore";
import { DryRunChange } from "../../lib/tauri";

export interface DryRunTabContentProps {
  watchedTables: string[];
  getWatchedTableData: (fullName: string) => WatchedTableData | undefined;
  getDryRunChangesForTable: (schema: string, table: string) => DryRunChange[];
}

export function DryRunTabContent({
  watchedTables,
  getWatchedTableData,
  getDryRunChangesForTable
}: DryRunTabContentProps) {

  return (
    <motion.div
      key="dryrun"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 flex flex-col overflow-hidden"
    >
      {/* Dry Run Header */}
      <div className="h-12 px-4 py-2 border-b border-border bg-secondary/30 flex items-center gap-2">
        <FlaskConical className="w-4 h-4 text-accent-cyan" />
        <span className="text-xs font-medium">Dry Run Mode</span>
        <span className="text-[10px] px-2 py-0.5 rounded bg-accent-cyan/10 text-accent-cyan">
          Preview Only — No Changes Saved
        </span>
      </div>

      {/* Tables Grid with Dry Run Changes */}
      {watchedTables.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <Eye className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium mb-2">No tables being watched</p>
            <p className="text-sm opacity-70">Watch tables to see dry run changes</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          <DryRunTablesGrid
            watchedTables={watchedTables}
            getWatchedTableData={getWatchedTableData}
            getDryRunChangesForTable={getDryRunChangesForTable}
          />
        </div>
      )}
    </motion.div>
  );
}

