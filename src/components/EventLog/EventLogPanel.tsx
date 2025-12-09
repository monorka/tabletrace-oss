/**
 * Event Log Panel Component - combines header and content with state management
 * Accepts optional expanded state props to share state across tabs
 */

import { EventLogPanelProps } from "../../types";
import { useEventLog } from "../../hooks/useEventLog";
import { EventLogHeader } from "./EventLogHeader";
import { EventLogContent } from "./EventLogContent";

export function EventLogPanel({ 
  events, 
  onClearEvents, 
  isBottom = false,
  expandedEventIds: externalExpandedIds,
  onToggleExpanded: externalToggleExpanded
}: EventLogPanelProps) {
  // Use external state if provided, otherwise create internal state
  const internalEventLog = useEventLog();
  const expandedIds = externalExpandedIds ?? internalEventLog.expandedIds;
  const toggleExpanded = externalToggleExpanded ?? internalEventLog.toggleExpanded;

  return (
    <div className={`${isBottom ? "h-48 border-t" : "w-80 border-l"} border-border bg-background flex flex-col`}>
      <EventLogHeader eventCount={events.length} onClearEvents={onClearEvents} />
      <EventLogContent
        events={events}
        expandedEventIds={expandedIds}
        onToggleExpanded={toggleExpanded}
      />
    </div>
  );
}

