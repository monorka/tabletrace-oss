/**
 * Side Panel Component - common panel for right/bottom positions
 * Handles Event Log and ERD Side Panel
 */

import { TabType, EventLogPosition, ERDHoveredTable } from "../../types";
import { TableChange } from "../../lib/tauri";
import { EventLogPanel } from "../EventLog";
import { ERDSidePanel } from "../ERD/ERDSidePanel";

export interface SidePanelProps {
  activeTab: TabType;
  eventLogPosition: EventLogPosition;
  events: TableChange[];
  onClearEvents: () => void;
  erdHoveredTable?: ERDHoveredTable | null;
  eventLogExpandedEventIds?: Set<string>;
  eventLogOnToggleExpanded?: (id: string) => void;
}

export function SidePanel({
  activeTab,
  eventLogPosition,
  events,
  onClearEvents,
  erdHoveredTable,
  eventLogExpandedEventIds,
  eventLogOnToggleExpanded
}: SidePanelProps) {
  const isBottom = eventLogPosition === "bottom";

  // Don't render if not needed
  // Timeline has its own event display, Dry Run has full-screen editor
  if (activeTab !== "erd" && activeTab !== "tables") {
    return null;
  }

  // ERD Side Panel
  if (activeTab === "erd" && erdHoveredTable !== undefined) {
    return (
      <ERDSidePanel
        hoveredTable={erdHoveredTable}
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

