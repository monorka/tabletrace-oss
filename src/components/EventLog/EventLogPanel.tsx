/**
 * Event Log Panel Component - combines header and content with internal state management
 */

import { EventLogPanelProps } from "../../types";
import { useEventLog } from "../../hooks/useEventLog";
import { EventLogHeader } from "./EventLogHeader";
import { EventLogContent } from "./EventLogContent";

export function EventLogPanel({ events, onClearEvents, isBottom = false }: EventLogPanelProps) {
  const { expandedIds, toggleExpanded } = useEventLog();

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

