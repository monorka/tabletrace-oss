/**
 * ERD Side Panel Component (Table Details + Event Log)
 */

import { Table2, MousePointer2, Key, ArrowRight, ArrowLeft, Trash2 } from "lucide-react";
import { TableChange } from "../../lib/tauri";
import { ERDHoveredTable } from "../../types";
import { EventLogContent } from "../EventLog";

interface ERDSidePanelProps {
  hoveredTable: ERDHoveredTable | null;
  events: TableChange[];
  expandedEventIds: Set<string>;
  onToggleExpanded: (id: string) => void;
  onClearEvents: () => void;
  isBottom?: boolean;
}

export function ERDSidePanel({
  hoveredTable,
  events: evts,
  expandedEventIds: expandedIds,
  onToggleExpanded: onToggle,
  onClearEvents,
  isBottom = false
}: ERDSidePanelProps) {
  return (
    <div className={`${isBottom ? 'h-64 border-t' : 'w-80 border-l'} border-[var(--border-color)] bg-[var(--bg-secondary)] flex ${isBottom ? 'flex-row' : 'flex-col'}`}>
      {/* Table Details Section */}
      <div className={`${isBottom ? 'w-1/2 border-r' : 'h-1/2 border-b'} border-[var(--border-color)] flex flex-col`}>
        <div className="p-3 border-b border-[var(--border-color)] flex items-center gap-2 flex-shrink-0">
          <Table2 className="w-3.5 h-3.5 text-[var(--accent-purple)]" />
          <h2 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
            Table Details
          </h2>
        </div>
        <div className="flex-1 overflow-auto p-3">
          {hoveredTable ? (
            <div className="space-y-3">
              {/* Table Name */}
              <div>
                <div className="text-sm font-medium text-[var(--text-primary)]">{hoveredTable.table}</div>
                <div className="text-[10px] text-[var(--text-secondary)]">{hoveredTable.schema}</div>
              </div>

              {/* Columns */}
              <div>
                <div className="text-[10px] font-medium text-[var(--text-secondary)] uppercase mb-1">
                  Columns ({hoveredTable.columns.length})
                </div>
                <div className="space-y-0.5">
                  {hoveredTable.columns.slice(0, 10).map((col, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-[10px]">
                      {col.isPrimaryKey ? (
                        <Key className="w-2.5 h-2.5 text-[var(--accent-yellow)]" />
                      ) : (
                        <span className="w-2.5 h-2.5 text-[var(--text-secondary)] text-center">◇</span>
                      )}
                      <span className={col.isPrimaryKey ? 'text-[var(--accent-yellow)]' : 'text-[var(--text-primary)]'}>
                        {col.name}
                      </span>
                      <span className="text-[var(--text-secondary)] ml-auto">{col.type}</span>
                    </div>
                  ))}
                  {hoveredTable.columns.length > 10 && (
                    <div className="text-[9px] text-[var(--text-secondary)]">
                      +{hoveredTable.columns.length - 10} more
                    </div>
                  )}
                </div>
              </div>

              {/* Outgoing Foreign Keys */}
              {hoveredTable.outgoingFKs.length > 0 && (
                <div>
                  <div className="text-[10px] font-medium text-[var(--text-secondary)] uppercase mb-1">
                    References ({hoveredTable.outgoingFKs.length})
                  </div>
                  <div className="space-y-0.5">
                    {hoveredTable.outgoingFKs.map((fk, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 text-[10px]">
                        <ArrowRight className="w-2.5 h-2.5 text-[var(--accent-green)]" />
                        <span className="text-[var(--text-primary)]">{fk.to_table}</span>
                        <span className="text-[var(--text-secondary)]">({fk.from_column})</span>
                        <span className="text-[8px] text-[var(--accent-purple)] ml-auto">{fk.on_delete}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Incoming Foreign Keys */}
              {hoveredTable.incomingFKs.length > 0 && (
                <div>
                  <div className="text-[10px] font-medium text-[var(--text-secondary)] uppercase mb-1">
                    Referenced By ({hoveredTable.incomingFKs.length})
                  </div>
                  <div className="space-y-0.5">
                    {hoveredTable.incomingFKs.map((fk, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 text-[10px]">
                        <ArrowLeft className="w-2.5 h-2.5 text-[var(--accent-cyan)]" />
                        <span className="text-[var(--text-primary)]">{fk.from_table}</span>
                        <span className="text-[var(--text-secondary)]">({fk.from_column})</span>
                        <span className="text-[8px] text-[var(--accent-purple)] ml-auto">{fk.on_delete}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-[var(--text-secondary)]">
                <MousePointer2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">Hover a table to see details</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Event Log Section */}
      <div className={`${isBottom ? 'w-1/2' : 'h-1/2'} flex flex-col`}>
        <div className="p-3 border-b border-[var(--border-color)] flex items-center justify-between flex-shrink-0">
          <h2 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
            Event Log ({evts.length})
          </h2>
          <div className="flex items-center gap-2">
            {evts.length > 0 && (
              <button
                onClick={onClearEvents}
                className="p-1 rounded hover:bg-[var(--accent-red)]/20 text-[var(--text-secondary)] hover:text-[var(--accent-red)] transition-colors"
                title="Clear all events"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--accent-green)]/20 text-[var(--accent-green)] animate-pulse">
              ● Live
            </span>
          </div>
        </div>
        <EventLogContent
          events={evts}
          expandedEventIds={expandedIds}
          onToggleExpanded={onToggle}
        />
      </div>
    </div>
  );
}




