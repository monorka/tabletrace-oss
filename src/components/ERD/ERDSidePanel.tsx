/**
 * ERD Side Panel Component (Table Details only)
 * Resizable panel showing hovered/clicked table information
 */

import { useState, useRef, useCallback } from "react";
import { Table2, MousePointer2, Key, ArrowRight, ArrowLeft, ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from "lucide-react";
import { ERDHoveredTable } from "../../types";
import { cn } from "../../lib/utils";

interface ERDSidePanelProps {
  hoveredTable: ERDHoveredTable | null;
  isBottom?: boolean;
}

export function ERDSidePanel({
  hoveredTable,
  isBottom = false
}: ERDSidePanelProps) {
  // Collapse state
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Resize state
  const [size, setSize] = useState(isBottom ? 256 : 320);
  const isResizing = useRef(false);
  const startPos = useRef(0);
  const startSize = useRef(0);

  const MIN_SIZE = 100;
  const COLLAPSE_THRESHOLD = 60;
  const DEFAULT_SIZE = isBottom ? 256 : 320;

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    startPos.current = isBottom ? e.clientY : e.clientX;
    startSize.current = size;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      const delta = isBottom
        ? startPos.current - e.clientY
        : startPos.current - e.clientX;
      const rawSize = startSize.current + delta;

      if (rawSize < COLLAPSE_THRESHOLD) {
        setIsCollapsed(true);
        isResizing.current = false;
        document.removeEventListener("mousemove", handleMouseMove);
        return;
      }

      const newSize = Math.max(MIN_SIZE, Math.min(600, rawSize));
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

  const handleExpand = () => {
    setSize(DEFAULT_SIZE);
    setIsCollapsed(false);
  };

  if (isCollapsed) {
    return (
      <div
        onClick={handleExpand}
        className={cn(
          "border-border bg-background flex items-center justify-center cursor-pointer hover:bg-secondary transition-colors",
          isBottom ? "h-8 border-t w-full" : "w-8 border-l h-full"
        )}
        title="Show Table Details"
      >
        <CollapseIcon className="w-4 h-4 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "border-border bg-secondary flex flex-col relative",
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

      {/* Header */}
      <div className="h-12 p-3 border-b border-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Table2 className="w-3.5 h-3.5 text-accent-purple" />
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Table Details
          </h2>
        </div>
        <button
          onClick={() => setIsCollapsed(true)}
          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          title="Hide Panel"
        >
          <CollapseIcon className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-3">
        {hoveredTable ? (
          <div className="space-y-3">
            {/* Table Name */}
            <div>
              <div className="text-sm font-medium text-foreground">{hoveredTable.table}</div>
              <div className="text-[10px] text-muted-foreground">{hoveredTable.schema}</div>
            </div>

            {/* Columns */}
            <div>
              <div className="text-[10px] font-medium text-muted-foreground uppercase mb-1">
                Columns ({hoveredTable.columns.length})
              </div>
              <div className="space-y-0.5">
                {hoveredTable.columns.map((col, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 text-[10px]">
                    {col.isPrimaryKey ? (
                      <Key className="w-2.5 h-2.5 text-accent-yellow" />
                    ) : (
                      <span className="w-2.5 h-2.5 text-muted-foreground text-center">◇</span>
                    )}
                    <span className={cn(
                      col.isPrimaryKey ? "text-accent-yellow" : "text-foreground"
                    )}>
                      {col.name}
                    </span>
                    <span className="text-muted-foreground ml-auto">{col.type}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Outgoing Foreign Keys */}
            {hoveredTable.outgoingFKs.length > 0 && (
              <div>
                <div className="text-[10px] font-medium text-muted-foreground uppercase mb-1">
                  References ({hoveredTable.outgoingFKs.length})
                </div>
                <div className="space-y-0.5">
                  {hoveredTable.outgoingFKs.map((fk, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-[10px]">
                      <ArrowRight className="w-2.5 h-2.5 text-accent-green" />
                      <span className="text-foreground">{fk.to_table}</span>
                      <span className="text-muted-foreground">({fk.from_column})</span>
                      <span className="text-[8px] text-accent-purple ml-auto">{fk.on_delete}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Incoming Foreign Keys */}
            {hoveredTable.incomingFKs.length > 0 && (
              <div>
                <div className="text-[10px] font-medium text-muted-foreground uppercase mb-1">
                  Referenced By ({hoveredTable.incomingFKs.length})
                </div>
                <div className="space-y-0.5">
                  {hoveredTable.incomingFKs.map((fk, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-[10px]">
                      <ArrowLeft className="w-2.5 h-2.5 text-accent-cyan" />
                      <span className="text-foreground">{fk.from_table}</span>
                      <span className="text-muted-foreground">({fk.from_column})</span>
                      <span className="text-[8px] text-accent-purple ml-auto">{fk.on_delete}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <MousePointer2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs">Click a table to see details</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
