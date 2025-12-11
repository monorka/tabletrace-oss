/**
 * Tab Content Area Component - handles tab content switching
 */

import { AnimatePresence } from "framer-motion";
import { TabType, ERDHoveredTable } from "../../types";
import { TableInfo, ForeignKeyInfo, DryRunResult } from "../../lib/tauri";
import { TableChange } from "../../lib/tauri";
import { WatchedTableData, TableChangeInfo } from "../../stores/connectionStore";
import { TablesTabContent } from "./TablesTabContent";
import { TimelineTabContent } from "./TimelineTabContent";
import { ERDTabContent } from "./ERDTabContent";
import { DryRunTabContent } from "./DryRunTabContent";

export interface TabContentAreaProps {
  activeTab: TabType;
  tables: TableInfo[];
  foreignKeys: ForeignKeyInfo[];
  watchedTables: string[];
  events: TableChange[];
  tablesWithChanges: TableChangeInfo[];
  getChangesForTable: (schema: string, table: string) => TableChange[];
  getWatchedTableData: (fullName: string) => WatchedTableData | undefined;
  onSelectTable: (schema: string, table: string) => void;
  selectedTable?: { schema: string; table: string };
  onClearEvents: () => void;
  onHoveredTableChange?: (table: ERDHoveredTable | null) => void;
  // Dry Run props
  dryRunSql?: string;
  setDryRunSql?: (sql: string) => void;
  isDryRunning?: boolean;
  dryRunResult?: DryRunResult | null;
  onDryRun?: () => void;
}

export function TabContentArea({
  activeTab,
  tables,
  foreignKeys,
  watchedTables,
  events,
  getWatchedTableData,
  onSelectTable,
  onClearEvents,
  onHoveredTableChange,
  dryRunSql,
  setDryRunSql,
  isDryRunning,
  dryRunResult,
  onDryRun
}: TabContentAreaProps) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <AnimatePresence mode="wait">
        {activeTab === "tables" && (
          <TablesTabContent
            watchedTables={watchedTables}
            getWatchedTableData={getWatchedTableData}
            onSelectTable={onSelectTable}
          />
        )}

        {activeTab === "timeline" && (
          <TimelineTabContent
            events={events}
            onClearEvents={onClearEvents}
          />
        )}

        {activeTab === "erd" && (
          <ERDTabContent
            tables={tables}
            foreignKeys={foreignKeys}
            watchedTables={watchedTables}
            onHoveredTableChange={onHoveredTableChange}
          />
        )}

        {activeTab === "dryrun" && dryRunSql !== undefined && setDryRunSql && onDryRun && (
          <DryRunTabContent
            watchedTables={watchedTables}
            getWatchedTableData={getWatchedTableData}
            sql={dryRunSql}
            setSql={setDryRunSql}
            isRunning={isDryRunning || false}
            result={dryRunResult || null}
            onRun={onDryRun}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

