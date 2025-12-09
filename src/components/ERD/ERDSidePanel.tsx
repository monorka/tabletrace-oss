/**
 * ERD Side Panel Component (Table Details + Event Log)
 */

import { Table2, MousePointer2, Key, ArrowRight, ArrowLeft, Trash2 } from "lucide-react";
import { TableChange } from "../../lib/tauri";
import { ERDHoveredTable } from "../../types";
import { EventLogContent } from "../EventLog";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { cn } from "../../lib/utils";

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
    <div className={cn(
      isBottom ? 'h-64 border-t' : 'w-80 border-l',
      "border-border bg-secondary flex",
      isBottom ? 'flex-row' : 'flex-col'
    )}>
      {/* Table Details Section */}
      <div className={cn(
        isBottom ? 'w-1/2 border-r' : 'h-1/2 border-b',
        "border-border flex flex-col"
      )}>
        <div className="p-3 border-b border-border flex items-center gap-2 shrink-0">
          <Table2 className="w-3.5 h-3.5 text-accent-purple" />
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Table Details
          </h2>
        </div>
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
                  {hoveredTable.columns.slice(0, 10).map((col, idx) => (
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
                  {hoveredTable.columns.length > 10 && (
                    <div className="text-[9px] text-muted-foreground">
                      +{hoveredTable.columns.length - 10} more
                    </div>
                  )}
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
                <p className="text-xs">Hover a table to see details</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Event Log Section */}
      <div className={cn(
        isBottom ? 'w-1/2' : 'h-1/2',
        "flex flex-col"
      )}>
        <div className="p-3 border-b border-border flex items-center justify-between shrink-0">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Event Log ({evts.length})
          </h2>
          <div className="flex items-center gap-2">
            {evts.length > 0 && (
              <Button
                onClick={onClearEvents}
                variant="ghost"
                size="icon"
                className="h-auto w-auto p-1 text-muted-foreground hover:text-accent-red hover:bg-accent-red/20"
                title="Clear all events"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            )}
            <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 bg-accent-green/20 text-accent-green border-accent-green/30 animate-pulse">
              ● Live
            </Badge>
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




