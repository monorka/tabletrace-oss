/**
 * Connected View Component - Main view when connected to database
 * Refactored to focus only on layout management
 */

import { useState, useEffect } from "react";
import { ConnectedViewProps, ERDHoveredTable } from "../../types";
import { useDryRun } from "../../hooks/useDryRun";
import { useEventLog } from "../../hooks/useEventLog";
import { TableListPanel } from "../Tables";
import { TabContentArea } from "./TabContentArea";
import { SidePanel } from "../SidePanel";

export function ConnectedView({
  activeTab,
  tables,
  foreignKeys,
  watchedTables,
  events,
  tablesWithChanges,
  onRefreshTables,
  onStartWatch,
  onStopWatch,
  onSelectTable,
  selectedTable,
  getChangesForTable,
  getWatchedTableData,
  onClearEvents,
  layoutSettings,
  onStopAllWatch
}: ConnectedViewProps) {
  const { tableListOpen, eventLogPosition } = layoutSettings;

  // Dry Run state management
  const dryRun = useDryRun();

  // ERD hovered table state (managed here to pass to SidePanel)
  const [erdHoveredTable, setErdHoveredTable] = useState<ERDHoveredTable | null>(null);

  // Event Log expanded state for ERD panel
  const eventLog = useEventLog();

  // Clear dry run result when switching away from dryrun tab
  useEffect(() => {
    if (activeTab !== "dryrun") {
      dryRun.clearResult();
    }
  }, [activeTab, dryRun]);

  return (
    <div className={`flex-1 flex ${eventLogPosition === "bottom" ? "flex-col" : ""} overflow-hidden`}>
      <div className="flex-1 flex overflow-hidden">
        {/* Table List Panel */}
        {tableListOpen && (
          <TableListPanel
            tables={tables}
            watchedTables={watchedTables}
            selectedTable={selectedTable}
            tablesWithChanges={tablesWithChanges}
            getChangesForTable={getChangesForTable}
            onSelectTable={onSelectTable}
            onStartWatch={onStartWatch}
            onStopWatch={onStopWatch}
            onRefreshTables={onRefreshTables}
            onStopAllWatch={onStopAllWatch}
          />
        )}

        {/* Content Area */}
        <TabContentArea
          activeTab={activeTab}
          tables={tables}
          foreignKeys={foreignKeys}
          watchedTables={watchedTables}
          events={events}
          tablesWithChanges={tablesWithChanges}
          getChangesForTable={getChangesForTable}
          getWatchedTableData={getWatchedTableData}
          onSelectTable={onSelectTable}
          selectedTable={selectedTable}
          onClearEvents={onClearEvents}
          onHoveredTableChange={setErdHoveredTable}
          dryRunSql={dryRun.sql}
          setDryRunSql={dryRun.setSql}
          isDryRunning={dryRun.isRunning}
          dryRunResult={dryRun.result}
          onDryRun={dryRun.run}
        />

        {/* Side Panel - Right Position */}
        {eventLogPosition === "right" && (
          <SidePanel
            activeTab={activeTab}
            eventLogPosition={eventLogPosition}
            events={events}
            onClearEvents={onClearEvents}
            erdHoveredTable={erdHoveredTable}
            eventLogExpandedEventIds={eventLog.expandedIds}
            eventLogOnToggleExpanded={eventLog.toggleExpanded}
          />
        )}
      </div>

      {/* Side Panel - Bottom Position */}
      {eventLogPosition === "bottom" && (
        <SidePanel
          activeTab={activeTab}
          eventLogPosition={eventLogPosition}
          events={events}
          onClearEvents={onClearEvents}
          erdHoveredTable={erdHoveredTable}
          eventLogExpandedEventIds={eventLog.expandedIds}
          eventLogOnToggleExpanded={eventLog.toggleExpanded}
        />
      )}
    </div>
  );
}
