/**
 * Timeline View Component with Correlation
 */

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Clock, Plus, Pencil, Trash2, Link2, ChevronDown, ChevronUp } from "lucide-react";
import { TableChange } from "../../lib/tauri";
import { getCorrelatedEvents } from "../../stores/connectionStore";
import { formatCorrelationMethod, formatConfidence, CorrelatedEventGroup } from "../../lib/correlation";
import { TimelineViewProps } from "../../types";

export function TimelineView({ events, onClearEvents }: TimelineViewProps) {
  const [viewMode, setViewMode] = useState<"all" | "grouped">("grouped");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Get correlated event groups
  const correlatedGroups = React.useMemo(() => {
    return getCorrelatedEvents(events, { windowMs: 100, minGroupSize: 2 });
  }, [events]);

  // Get events that are not in any group
  const groupedEventIds = React.useMemo(() => {
    const ids = new Set<string>();
    correlatedGroups.forEach(group => {
      group.events.forEach(e => ids.add(e.id));
    });
    return ids;
  }, [correlatedGroups]);

  const ungroupedEvents = React.useMemo(() => {
    return events.filter(e => !groupedEventIds.has(e.id));
  }, [events, groupedEventIds]);

  // Merge groups and ungrouped events, sorted by timestamp (oldest first)
  const sortedTimelineItems = React.useMemo(() => {
    const items: Array<{ type: 'group'; data: CorrelatedEventGroup } | { type: 'event'; data: TableChange }> = [
      ...correlatedGroups.map(g => ({ type: 'group' as const, data: g })),
      ...ungroupedEvents.map(e => ({ type: 'event' as const, data: e }))
    ];
    // Sort by timestamp ascending (oldest first)
    return items.sort((a, b) => {
      const timeA = new Date(a.type === 'group' ? a.data.timestamp : a.data.timestamp).getTime();
      const timeB = new Date(b.type === 'group' ? b.data.timestamp : b.data.timestamp).getTime();
      return timeA - timeB;
    });
  }, [correlatedGroups, ungroupedEvents]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  // Render single event
  const renderEvent = (event: TableChange, index: number, isInGroup = false) => (
    <motion.div
      key={event.id}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.02 }}
      className={`relative flex gap-4 ${isInGroup ? "ml-6" : ""}`}
    >
      {/* Timeline dot */}
      <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
        event.type === "INSERT" ? "bg-[var(--accent-green)]/20 text-[var(--accent-green)]" :
        event.type === "UPDATE" ? "bg-[var(--accent-yellow)]/20 text-[var(--accent-yellow)]" :
        "bg-[var(--accent-red)]/20 text-[var(--accent-red)]"
      }`}>
        {event.type === "INSERT" ? (
          <Plus className="w-4 h-4" />
        ) : event.type === "UPDATE" ? (
          <Pencil className="w-4 h-4" />
        ) : (
          <Trash2 className="w-4 h-4" />
        )}
      </div>

      {/* Event card */}
      <div className="flex-1 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-3 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className={`text-xs font-medium px-2 py-0.5 rounded uppercase ${
              event.type === "INSERT" ? "bg-[var(--accent-green)]/20 text-[var(--accent-green)]" :
              event.type === "UPDATE" ? "bg-[var(--accent-yellow)]/20 text-[var(--accent-yellow)]" :
              "bg-[var(--accent-red)]/20 text-[var(--accent-red)]"
            }`}>
              {event.type}
            </span>
            <span className="text-sm font-medium truncate">{event.table}</span>
          </div>
          <span className="text-[10px] text-[var(--text-secondary)] flex-shrink-0">
            {new Date(event.timestamp).toLocaleTimeString()}
          </span>
        </div>

        {/* Event details */}
        <div className="text-xs font-mono bg-[var(--bg-primary)] rounded p-2 overflow-x-auto">
          {event.type === "UPDATE" && event.before && event.after ? (
            <div className="space-y-1">
              {Object.keys(event.after).filter(key =>
                JSON.stringify(event.before?.[key]) !== JSON.stringify(event.after?.[key])
              ).slice(0, 5).map((key) => (
                <div key={key} className="flex gap-2">
                  <span className="text-[var(--text-secondary)]">{key}:</span>
                  <span className="text-[var(--accent-red)] line-through">{String(event.before?.[key] ?? "null")}</span>
                  <span className="text-[var(--text-secondary)]">→</span>
                  <span className="text-[var(--accent-green)]">{String(event.after?.[key] ?? "null")}</span>
                </div>
              ))}
            </div>
          ) : event.after ? (
            <div className="truncate">
              {JSON.stringify(event.after).substring(0, 200)}
              {JSON.stringify(event.after).length > 200 && "..."}
            </div>
          ) : event.before ? (
            <div className="truncate text-[var(--accent-red)]">
              {JSON.stringify(event.before).substring(0, 200)}
              {JSON.stringify(event.before).length > 200 && "..."}
            </div>
          ) : (
            <span className="text-[var(--text-secondary)]">No details</span>
          )}
        </div>
      </div>
    </motion.div>
  );

  // Render correlation group
  const renderGroup = (group: CorrelatedEventGroup, index: number) => {
    const isExpanded = expandedGroups.has(group.id);
    const tables = [...new Set(group.events.map(e => e.table))];

    return (
      <motion.div
        key={group.id}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.03 }}
        className="relative"
      >
        {/* Group header */}
        <div
          className="flex gap-4 cursor-pointer"
          onClick={() => toggleGroup(group.id)}
        >
          {/* Group icon */}
          <div className="relative z-10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-[var(--accent-purple)]/20 text-[var(--accent-purple)]">
            <Link2 className="w-4 h-4" />
          </div>

          {/* Group card */}
          <div className="flex-1 bg-[var(--accent-purple)]/10 border border-[var(--accent-purple)]/30 rounded-lg p-3 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0 flex-wrap">
                <span className="text-xs font-medium px-2 py-0.5 rounded bg-[var(--accent-purple)]/20 text-[var(--accent-purple)]">
                  {group.events.length} Related Changes
                </span>
                <span className="text-[10px] text-[var(--text-secondary)] px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)]">
                  {formatCorrelationMethod(group.correlationMethod)}
                </span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                  group.confidence >= 0.8 ? "bg-[var(--accent-green)]/20 text-[var(--accent-green)]" :
                  group.confidence >= 0.6 ? "bg-[var(--accent-yellow)]/20 text-[var(--accent-yellow)]" :
                  "bg-[var(--bg-tertiary)] text-[var(--text-secondary)]"
                }`}>
                  {formatConfidence(group.confidence)}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-[10px] text-[var(--text-secondary)]">
                  {new Date(group.timestamp).toLocaleTimeString()}
                </span>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-[var(--text-secondary)]" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[var(--text-secondary)]" />
                )}
              </div>
            </div>

            {/* Tables involved */}
            <div className="flex flex-wrap gap-1 mt-2">
              {tables.map(table => (
                <span key={table} className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-primary)] text-[var(--text-secondary)]">
                  {table}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Expanded events */}
        {isExpanded && (
          <div className="mt-3 space-y-3 border-l-2 border-[var(--accent-purple)]/30 ml-5 pl-4">
            {group.events.map((event, i) => renderEvent(event, i, true))}
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <motion.div
      key="timeline"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 flex flex-col overflow-hidden"
    >
      {/* Timeline Header */}
      <div className="px-4 py-2 border-b border-[var(--border-color)] bg-[var(--bg-tertiary)]/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[var(--accent-cyan)]" />
          <span className="text-xs font-medium">Change Event Timeline</span>
          <span className="text-[10px] text-[var(--text-secondary)] px-2 py-0.5 rounded-full bg-[var(--bg-tertiary)]">
            {events.length} events
          </span>
          {correlatedGroups.length > 0 && (
            <span className="text-[10px] text-[var(--accent-purple)] px-2 py-0.5 rounded-full bg-[var(--accent-purple)]/10">
              {correlatedGroups.length} groups
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* View mode toggle */}
          <div className="flex items-center gap-1 bg-[var(--bg-tertiary)] rounded-lg p-0.5">
            <button
              onClick={() => setViewMode("grouped")}
              className={`px-2 py-1 text-[10px] font-medium rounded transition-colors ${
                viewMode === "grouped"
                  ? "bg-[var(--accent-purple)] text-white"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              Grouped
            </button>
            <button
              onClick={() => setViewMode("all")}
              className={`px-2 py-1 text-[10px] font-medium rounded transition-colors ${
                viewMode === "all"
                  ? "bg-[var(--accent-purple)] text-white"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              All
            </button>
          </div>

          {events.length > 0 && (
            <button
              onClick={onClearEvents}
              className="text-xs text-[var(--text-secondary)] hover:text-[var(--accent-red)] transition-colors"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Timeline Content */}
      <div className="flex-1 overflow-y-auto">
        {events.length === 0 ? (
          <div className="flex-1 flex items-center justify-center h-full text-[var(--text-secondary)]">
            <div className="text-center py-12">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm mb-2">No events yet</p>
              <p className="text-xs opacity-70">Watch a table to see changes here</p>
            </div>
          </div>
        ) : viewMode === "all" ? (
          // All events view (oldest first)
          <div className="p-4">
            <div className="relative">
              <div className="absolute left-[19px] top-0 bottom-0 w-px bg-[var(--border-color)]" />
              <div className="space-y-4">
                {[...events].reverse().map((event, index) => renderEvent(event, index))}
              </div>
            </div>
          </div>
        ) : (
          // Grouped view (oldest first, merged timeline)
          <div className="p-4">
            <div className="relative">
              <div className="absolute left-[19px] top-0 bottom-0 w-px bg-[var(--border-color)]" />
              <div className="space-y-4">
                {sortedTimelineItems.map((item, index) =>
                  item.type === 'group'
                    ? renderGroup(item.data, index)
                    : renderEvent(item.data, index)
                )}

                {/* No groups message */}
                {correlatedGroups.length === 0 && ungroupedEvents.length > 0 && (
                  <div className="text-center py-4 text-xs text-[var(--text-secondary)]">
                    No correlated events detected yet
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

