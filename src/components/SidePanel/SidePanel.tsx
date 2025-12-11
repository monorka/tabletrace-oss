/**
 * Side Panel Component - common panel for right/bottom positions
 * Handles Event Log, ERD Side Panel, and Dry Run SQL Panel
 */

import { TabType, EventLogPosition, ERDHoveredTable } from "../../types";
import { TableChange, DryRunResult } from "../../lib/tauri";
import { EventLogPanel } from "../EventLog";
import { ERDSidePanel } from "../ERD/ERDSidePanel";
import { DryRunSqlPanel } from "../DryRun/DryRunSqlPanel";

export interface SidePanelProps {
  activeTab: TabType;
  eventLogPosition: EventLogPosition;
  events: TableChange[];
  onClearEvents: () => void;
  erdHoveredTable?: ERDHoveredTable | null;
  erdExpandedEventIds?: Set<string>;
  erdOnToggleExpanded?: (id: string) => void;
  eventLogExpandedEventIds?: Set<string>;
  eventLogOnToggleExpanded?: (id: string) => void;
  dryRunSql?: string;
  setDryRunSql?: (sql: string) => void;
  isDryRunning?: boolean;
  dryRunResult?: DryRunResult | null;
  onDryRun?: () => void;
}

export function SidePanel({
  activeTab,
  eventLogPosition,
  events,
  onClearEvents,
  erdHoveredTable,
  erdExpandedEventIds,
  erdOnToggleExpanded,
  eventLogExpandedEventIds,
  eventLogOnToggleExpanded,
  dryRunSql,
  setDryRunSql,
  isDryRunning,
  dryRunResult,
  onDryRun
}: SidePanelProps) {
  const isBottom = eventLogPosition === "bottom";

  // Don't render if not needed
  if (activeTab !== "dryrun" && activeTab !== "erd" && activeTab !== "tables" && activeTab !== "timeline") {
    return null;
  }

  // Dry Run Panel
  if (activeTab === "dryrun" && dryRunSql !== undefined && setDryRunSql && onDryRun) {
    return (
      <DryRunSqlPanel
        sql={dryRunSql}
        setSql={setDryRunSql}
        isRunning={isDryRunning || false}
        result={dryRunResult || null}
        onRun={onDryRun}
        isBottom={isBottom}
      />
    );
  }

  // ERD Side Panel
  if (activeTab === "erd" && erdHoveredTable !== undefined && erdExpandedEventIds && erdOnToggleExpanded) {
    return (
      <ERDSidePanel
        hoveredTable={erdHoveredTable}
        events={events}
        expandedEventIds={erdExpandedEventIds}
        onToggleExpanded={erdOnToggleExpanded}
        onClearEvents={onClearEvents}
        isBottom={isBottom}
      />
    );
  }

  // Event Log Panel (default for tables and timeline tabs)
  // Pass shared state to maintain consistency across tabs
  return (
    <EventLogPanel
      events={events}
      onClearEvents={onClearEvents}
      isBottom={isBottom}
      expandedEventIds={eventLogExpandedEventIds}
      onToggleExpanded={eventLogOnToggleExpanded}
    />
  );
}

