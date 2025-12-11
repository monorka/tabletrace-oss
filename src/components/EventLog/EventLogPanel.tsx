/**
 * Event Log Panel Component - combines header and content with state management
 * Accepts optional expanded state props to share state across tabs
 * Features: resizable width, collapsible, horizontal scroll in content
 */

import { useState, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from "lucide-react";
import { Trash2 } from "lucide-react";
import { EventLogPanelProps } from "../../types";
import { useEventLog } from "../../hooks/useEventLog";
import { EventLogContent } from "./EventLogContent";
import { cn } from "../../lib/utils";

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

  // Collapse state
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Resize state
  const [size, setSize] = useState(isBottom ? 192 : 320); // h-48 = 192px, w-80 = 320px
  const isResizing = useRef(false);
  const startPos = useRef(0);
  const startSize = useRef(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    startPos.current = isBottom ? e.clientY : e.clientX;
    startSize.current = size;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      const delta = isBottom
        ? startPos.current - e.clientY  // Dragging up increases height
        : startPos.current - e.clientX; // Dragging left increases width
      const newSize = Math.max(100, Math.min(600, startSize.current + delta));
      setSize(newSize);
    };

    const handleMouseUp = () => {
      isResizing.current = false;
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }, [isBottom, size]);

  const CollapseIcon = isBottom
    ? (isCollapsed ? ChevronUp : ChevronDown)
    : (isCollapsed ? ChevronLeft : ChevronRight);

  if (isCollapsed) {
    return (
      <div
        onClick={() => setIsCollapsed(false)}
        className={cn(
          "border-border bg-background flex items-center justify-center cursor-pointer hover:bg-secondary transition-colors",
          isBottom ? "h-8 border-t w-full" : "w-8 border-l h-full"
        )}
        title="Show Event Log"
      >
        <CollapseIcon className="w-4 h-4 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "border-border bg-background flex flex-col relative",
        isBottom ? "border-t" : "border-l"
      )}
      style={isBottom ? { height: size } : { width: size }}
    >
      {/* Resize handle */}
      <div
        className={cn(
          "absolute bg-transparent hover:bg-accent-purple/30 transition-colors z-10",
          isBottom
            ? "top-0 left-0 right-0 h-1 cursor-ns-resize"
            : "top-0 left-0 bottom-0 w-1 cursor-ew-resize"
        )}
        onMouseDown={handleMouseDown}
      />

      {/* Header with integrated collapse button */}
      <div className="h-12 p-3 border-b border-border flex items-center justify-between shrink-0">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Event Log ({events.length})
        </h2>
        <div className="flex items-center gap-1">
          {events.length > 0 && (
            <button
              onClick={onClearEvents}
              className="p-1 rounded hover:bg-accent-red/20 text-muted-foreground hover:text-accent-red transition-colors"
              title="Clear all events"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent-green/20 text-accent-green animate-pulse">
            ● Live
          </span>
          <button
            onClick={() => setIsCollapsed(true)}
            className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors ml-1"
            title="Hide Event Log"
          >
            <CollapseIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <EventLogContent
        events={events}
        expandedEventIds={expandedIds}
        onToggleExpanded={toggleExpanded}
      />
    </div>
  );
}
