/**
 * Event Log Content Component - preserves scroll position across re-renders
 */

import React, { useRef, useLayoutEffect } from "react";
import { Activity } from "lucide-react";
import { EventLogContentProps } from "../../types";
import { formatTime } from "../../utils";
import { EventLogItem } from "./EventLogItem";

export function EventLogContent({ events, expandedEventIds, onToggleExpanded }: EventLogContentProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollTopRef = useRef<number>(0);

  // Restore scroll position after events update
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el && scrollTopRef.current > 0) {
      el.scrollTop = scrollTopRef.current;
    }
  });

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    scrollTopRef.current = e.currentTarget.scrollTop;
  };

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto p-2 space-y-1"
    >
      {events.length === 0 ? (
        <div className="text-center py-8 text-xs text-[var(--text-secondary)]">
          <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>Waiting for changes...</p>
          <p className="mt-1 opacity-70">Watch a table to see events</p>
        </div>
      ) : (
        [...events].slice(0, 100).reverse().map((event) => (
          <EventLogItem
            key={event.id}
            eventId={event.id}
            type={event.type}
            table={`${event.schema}.${event.table}`}
            time={formatTime(event.timestamp)}
            before={event.before}
            after={event.after}
            expanded={expandedEventIds.has(event.id)}
            onToggleExpanded={onToggleExpanded}
          />
        ))
      )}
    </div>
  );
}

