/**
 * Connected View Component - Main view when connected to database
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Table2, Eye, FlaskConical, Trash2 } from "lucide-react";
import { tauriCommands, DryRunResult } from "../../lib/tauri";
import { ConnectedViewProps, ERDHoveredTable } from "../../types";
import { EventLogContent } from "../EventLog";
import { ERDView } from "../ERD";
import { ERDSidePanel } from "../ERD/ERDSidePanel";
import { TableListPanel, WatchedTablesGrid } from "../Tables";
import { DryRunTablesGrid, DryRunSqlPanel } from "../DryRun";
import { TimelineView } from "./TimelineView";

export function ConnectedView({
  activeTab,
  tables,
  foreignKeys,
  watchedTables,
  watchedTableData: _watchedTableData,
  events,
  tablesWithChanges,
  onRefreshTables,
  onStartWatch,
  onStopWatch,
  onSelectTable,
  selectedTable,
  selectedTableColumns: _selectedTableColumns,
  selectedTableRows: _selectedTableRows,
  selectedTableRowCount: _selectedTableRowCount,
  getChangesForTable,
  getWatchedTableData,
  onClearEvents,
  layoutSettings,
  onStopAllWatch
}: ConnectedViewProps) {
  const { tableListOpen, eventLogPosition } = layoutSettings;

  // Dry Run State
  const [dryRunSql, setDryRunSql] = useState("");
  const [isDryRunning, setIsDryRunning] = useState(false);
  const [dryRunResult, setDryRunResult] = useState<DryRunResult | null>(null);

  // ERD hovered table state
  const [erdHoveredTable, setErdHoveredTable] = useState<ERDHoveredTable | null>(null);

  // Event Log expanded state (preserved across re-renders)
  const [expandedEventIds, setExpandedEventIds] = useState<Set<string>>(new Set());

  const toggleEventExpanded = (eventId: string) => {
    setExpandedEventIds(prev => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
      } else {
        next.add(eventId);
      }
      return next;
    });
  };

  // Clear dry run result when switching tabs
  useEffect(() => {
    if (activeTab !== "dryrun") {
      setDryRunResult(null);
    }
  }, [activeTab]);

  const handleDryRun = async () => {
    if (!dryRunSql.trim()) return;

    setIsDryRunning(true);
    setDryRunResult(null);

    try {
      const res = await tauriCommands.dryRun(dryRunSql);
      setDryRunResult(res);
    } catch (err) {
      setDryRunResult({
        success: false,
        changes: [],
        error: err instanceof Error ? err.message : String(err),
        rows_affected: 0,
      });
    } finally {
      setIsDryRunning(false);
    }
  };

  // Get dry run changes for a specific table
  const getDryRunChangesForTable = (schema: string, table: string) => {
    if (!dryRunResult?.changes) return [];
    return dryRunResult.changes.filter(c => c.schema === schema && c.table === table);
  };

  // Event Log Panel Header
  const EventLogHeader = () => (
    <div className="p-3 border-b border-[var(--border-color)] flex items-center justify-between flex-shrink-0">
      <h2 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
        Event Log ({events.length})
      </h2>
      <div className="flex items-center gap-2">
        {events.length > 0 && (
          <button
            onClick={onClearEvents}
            className="p-1 rounded hover:bg-[var(--accent-red)]/20 text-[var(--text-secondary)] hover:text-[var(--accent-red)] transition-colors"
            title="Clear all events"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--accent-green)]/20 text-[var(--accent-green)] animate-pulse">
          ● Live
        </span>
      </div>
    </div>
  );

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
        <div className="flex-1 flex flex-col overflow-hidden">
          <AnimatePresence mode="wait">
            {activeTab === "tables" && (
              <motion.div
                key="tables"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col overflow-hidden"
              >
                {/* Tables Header */}
                <div className="px-4 py-2 border-b border-[var(--border-color)] bg-[var(--bg-tertiary)]/30 flex items-center gap-2">
                  <Table2 className="w-4 h-4 text-[var(--accent-cyan)]" />
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
                  <div className="flex-1 h-full flex items-center justify-center text-[var(--text-secondary)]">
                    <div className="text-center">
                      <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-sm mb-2">No tables being watched</p>
                      <p className="text-xs">Click a table in the sidebar to start watching</p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === "timeline" && (
              <TimelineView
                events={events}
                onClearEvents={onClearEvents}
              />
            )}

            {activeTab === "erd" && (
              <ERDView
                tables={tables}
                foreignKeys={foreignKeys}
                watchedTables={watchedTables}
                onHoveredTableChange={setErdHoveredTable}
              />
            )}

            {activeTab === "dryrun" && (
              <motion.div
                key="dryrun"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col overflow-hidden"
              >
                {/* Dry Run Header */}
                <div className="px-4 py-2 border-b border-[var(--border-color)] bg-[var(--bg-tertiary)]/30 flex items-center gap-2">
                  <FlaskConical className="w-4 h-4 text-[var(--accent-cyan)]" />
                  <span className="text-xs font-medium">Dry Run Mode</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)]">
                    Preview Only — No Changes Saved
                  </span>
                </div>

                {/* Tables Grid with Dry Run Changes */}
                {watchedTables.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-[var(--text-secondary)]">
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
            )}
          </AnimatePresence>
        </div>

        {/* Right Panel - Event Log, SQL Input, or ERD Panel */}
        {eventLogPosition === "right" && (
          activeTab === "dryrun" ? (
            <DryRunSqlPanel
              sql={dryRunSql}
              setSql={setDryRunSql}
              isRunning={isDryRunning}
              result={dryRunResult}
              onRun={handleDryRun}
            />
          ) : activeTab === "erd" ? (
            <ERDSidePanel
              hoveredTable={erdHoveredTable}
              events={events}
              expandedEventIds={expandedEventIds}
              onToggleExpanded={toggleEventExpanded}
              onClearEvents={onClearEvents}
            />
          ) : (
            <div className="w-80 border-l border-[var(--border-color)] bg-[var(--bg-secondary)] flex flex-col">
              <EventLogHeader />
              <EventLogContent
                events={events}
                expandedEventIds={expandedEventIds}
                onToggleExpanded={toggleEventExpanded}
              />
            </div>
          )
        )}
      </div>

      {/* Bottom Panel - Event Log, SQL Input, or ERD Panel */}
      {eventLogPosition === "bottom" && (
        activeTab === "dryrun" ? (
          <DryRunSqlPanel
            sql={dryRunSql}
            setSql={setDryRunSql}
            isRunning={isDryRunning}
            result={dryRunResult}
            onRun={handleDryRun}
            isBottom
          />
        ) : activeTab === "erd" ? (
          <ERDSidePanel
            hoveredTable={erdHoveredTable}
            events={events}
            expandedEventIds={expandedEventIds}
            onToggleExpanded={toggleEventExpanded}
            onClearEvents={onClearEvents}
            isBottom
          />
        ) : (
          <div className="h-48 border-t border-[var(--border-color)] bg-[var(--bg-secondary)] flex flex-col">
            <EventLogHeader />
            <EventLogContent
              events={events}
              expandedEventIds={expandedEventIds}
              onToggleExpanded={toggleEventExpanded}
            />
          </div>
        )
      )}
    </div>
  );
}

