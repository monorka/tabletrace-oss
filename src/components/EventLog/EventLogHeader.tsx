/**
 * Event Log Header Component
 */

import { Trash2 } from "lucide-react";
import { EventLogHeaderProps } from "../../types";

export function EventLogHeader({ eventCount, onClearEvents }: EventLogHeaderProps) {
  return (
    <div className="p-3 border-b border-border flex items-center justify-between">
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Event Log ({eventCount})
      </h2>
      <div className="flex items-center gap-2">
        {eventCount > 0 && (
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
      </div>
    </div>
  );
}

