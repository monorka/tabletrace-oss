/**
 * ERD Table Node Component
 */

import { Table2, Key, Link2, Eye } from "lucide-react";
import { Handle, Position, NodeProps, Node } from "@xyflow/react";
import { TableNodeData, NODE_WIDTH } from "../../types";

export function TableNode({ data }: NodeProps<Node<TableNodeData>>) {
  const headerHeight = 32;
  const rowHeight = 22;
  const isHighlighted = data.isHighlighted ?? false;

  return (
    <div
      className={`bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg shadow-lg overflow-hidden transition-all duration-200
        ${isHighlighted ? 'ring-2 ring-[var(--accent-purple)] border-[var(--accent-purple)] shadow-[0_0_15px_rgba(167,139,250,0.4)]' : ''}`}
      style={{ width: NODE_WIDTH }}
    >
      {/* Table Header */}
      <div className="px-3 py-1.5 border-b border-[var(--border-color)] flex items-center gap-2 bg-[var(--bg-tertiary)]"
        style={{ height: headerHeight }}
      >
        <Table2 className="w-3.5 h-3.5 flex-shrink-0 text-[var(--text-secondary)]" />
        <div className="flex-1 min-w-0">
          <div className="font-medium text-[11px] truncate">{data.table}</div>
        </div>
        {data.isWatched && (
          <Eye className="w-3 h-3 text-[var(--accent-green)] flex-shrink-0" />
        )}
      </div>

      {/* Columns */}
      <div className="overflow-hidden">
        {data.columns.slice(0, 8).map((col, idx) => (
          <div
            key={idx}
            className="px-3 text-[10px] flex items-center gap-1.5 border-b border-[var(--border-color)]/20 last:border-b-0"
            style={{ height: rowHeight }}
          >
            {col.isPrimaryKey ? (
              <Key className="w-2.5 h-2.5 text-[var(--accent-yellow)] flex-shrink-0" />
            ) : col.name.endsWith('_id') ? (
              <Link2 className="w-2.5 h-2.5 text-[var(--accent-green)] flex-shrink-0" />
            ) : (
              <span className="w-2.5 h-2.5 flex-shrink-0 flex items-center justify-center text-[var(--text-secondary)]">◇</span>
            )}
            <span className={`truncate flex-1 ${col.isPrimaryKey ? 'text-[var(--accent-yellow)] font-medium' : col.name.endsWith('_id') ? 'text-[var(--accent-green)]' : 'text-[var(--text-primary)]'}`}>
              {col.name}
            </span>
            <span className="text-[var(--text-secondary)] flex-shrink-0 text-[9px] opacity-70">{col.type}</span>
          </div>
        ))}
        {data.columns.length > 8 && (
          <div className="px-3 text-[9px] text-[var(--text-secondary)] text-center bg-[var(--bg-tertiary)]/30" style={{ height: rowHeight, lineHeight: `${rowHeight}px` }}>
            +{data.columns.length - 8} more
          </div>
        )}
      </div>

      {/* Single handles at center for clean bezier curves */}
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-[var(--accent-purple)] !border-2 !border-[var(--bg-secondary)] !w-2.5 !h-2.5 !opacity-70"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-[var(--accent-purple)] !border-2 !border-[var(--bg-secondary)] !w-2.5 !h-2.5 !opacity-70"
      />
    </div>
  );
}




