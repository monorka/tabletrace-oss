/**
 * ERD Table Node Component
 * - Zoomed out (<50%): Shows only table name prominently
 * - Zoomed in (>=50%): Shows full table details with columns
 */

import React from "react";
import { Table2, Key, Link2, Eye } from "lucide-react";
import { Handle, Position, NodeProps, Node } from "@xyflow/react";
import { TableNodeData, NODE_WIDTH } from "../../types";
import { cn } from "../../lib/utils";

const ZOOM_THRESHOLD = 0.5; // Switch display mode at 50% zoom

// Memoize to prevent unnecessary re-renders
export const TableNode = React.memo(function TableNode({ data }: NodeProps<Node<TableNodeData>>) {
  const zoom = data.zoomLevel ?? 1;
  const isZoomedOut = zoom < ZOOM_THRESHOLD;

  const headerHeight = 44;
  const rowHeight = 32;
  const isHighlighted = data.isHighlighted ?? false;

  // Use 1.5x width for both zoomed out and zoomed in
  const nodeWidth = NODE_WIDTH * 1.5;

  if (isZoomedOut) {
    return (
      <div
        className={cn(
          "bg-secondary border-2 border-border rounded-lg shadow-lg overflow-hidden transition-all duration-200",
          isHighlighted && "ring-2 ring-accent-purple border-accent-purple shadow-[0_0_15px_rgba(167,139,250,0.4)]",
          data.isWatched && "border-accent-green"
        )}
        style={{ width: nodeWidth }}
      >
        <div className="px-6 py-6 flex items-center gap-5 bg-muted">
          <Table2 className="w-10 h-10 shrink-0 text-accent-purple" />
          <div className="flex-1 min-w-0">
            <div className="font-bold text-4xl truncate text-foreground">{data.table}</div>
            <div className="text-xl text-muted-foreground">{data.columns.length} columns</div>
          </div>
          {data.isWatched && (
            <Eye className="w-4 h-4 text-accent-green shrink-0" />
          )}
        </div>

        <Handle
          type="target"
          position={Position.Left}
          className="!bg-accent-purple !border-2 !border-secondary !w-3 !h-3 !opacity-80"
        />
        <Handle
          type="source"
          position={Position.Right}
          className="!bg-accent-purple !border-2 !border-secondary !w-3 !h-3 !opacity-80"
        />
      </div>
    );
  }

  // Zoomed in: Full detail view with columns
  return (
    <div
      className={cn(
        "bg-secondary border-2 border-border rounded-lg shadow-lg overflow-hidden transition-all duration-200",
        isHighlighted && "ring-2 ring-accent-purple border-accent-purple shadow-[0_0_15px_rgba(167,139,250,0.4)]"
      )}
      style={{ width: nodeWidth }}
    >
      {/* Table Header */}
      <div
        className="px-4 py-2 border-b border-border flex items-center gap-3 bg-muted"
        style={{ height: headerHeight }}
      >
        <Table2 className="w-5 h-5 shrink-0 text-accent-purple" />
        <div className="flex-1 min-w-0">
          <div className="font-bold text-base truncate">{data.table}</div>
        </div>
        {data.isWatched && (
          <Eye className="w-4 h-4 text-accent-green shrink-0" />
        )}
      </div>

      {/* Columns */}
      <div className="overflow-hidden">
        {data.columns.slice(0, 8).map((col, idx) => (
          <div
            key={idx}
            className="px-4 text-sm flex items-center gap-2 border-b border-border/20 last:border-b-0"
            style={{ height: rowHeight }}
          >
            {col.isPrimaryKey ? (
              <Key className="w-4 h-4 text-accent-yellow shrink-0" />
            ) : col.name.endsWith('_id') ? (
              <Link2 className="w-4 h-4 text-accent-green shrink-0" />
            ) : (
              <span className="w-4 h-4 shrink-0 flex items-center justify-center text-muted-foreground">◇</span>
            )}
            <span className={cn(
              "truncate flex-1",
              col.isPrimaryKey && "text-accent-yellow font-medium",
              !col.isPrimaryKey && col.name.endsWith('_id') && "text-accent-green",
              !col.isPrimaryKey && !col.name.endsWith('_id') && "text-foreground"
            )}>
              {col.name}
            </span>
            <span className="text-muted-foreground shrink-0 text-xs opacity-70">{col.type}</span>
          </div>
        ))}
        {data.columns.length > 8 && (
          <div className="px-4 text-xs text-muted-foreground text-center bg-muted/30" style={{ height: rowHeight, lineHeight: `${rowHeight}px` }}>
            +{data.columns.length - 8} more
          </div>
        )}
      </div>

      {/* Single handles at center for clean bezier curves */}
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-accent-purple !border-2 !border-secondary !w-3 !h-3 !opacity-80"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-accent-purple !border-2 !border-secondary !w-3 !h-3 !opacity-80"
      />
    </div>
  );
});
