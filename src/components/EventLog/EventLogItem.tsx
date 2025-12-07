/**
 * Event Log Item Component - single event entry
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { ChangeTypeBadge } from "../ui";
import { DiffViewer } from "./DiffViewer";
import { calculateDiff } from "../../utils";

interface EventLogItemProps {
  eventId: string;
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  time: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  expanded: boolean;
  onToggleExpanded: (eventId: string) => void;
}

export function EventLogItem({
  eventId,
  type,
  table,
  time,
  before,
  after,
  expanded,
  onToggleExpanded
}: EventLogItemProps) {
  const [showOnlyChanges, setShowOnlyChanges] = useState(true);

  // Count changes for UPDATE
  const changeCount = type === "UPDATE"
    ? calculateDiff(before, after).filter(d => d.changed).length
    : 0;

  return (
    <div
      className="rounded-md hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer"
      onClick={() => onToggleExpanded(eventId)}
    >
      <div className="px-2 py-1.5 flex items-center gap-2">
        <ChangeTypeBadge type={type} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium truncate">{table}</span>
            <span className="text-[10px] text-[var(--text-secondary)]">{time}</span>
          </div>
        </div>
        {type === "UPDATE" && changeCount > 0 && (
          <span className="text-[9px] px-1 py-0.5 rounded bg-[var(--accent-yellow)]/20 text-[var(--accent-yellow)]">
            {changeCount} changed
          </span>
        )}
        <motion.div
          animate={{ rotate: expanded ? 90 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronRight className="w-3 h-3 text-[var(--text-secondary)]" />
        </motion.div>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (before || after) && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-2 pb-2 overflow-hidden"
          >
            {/* Filter toggle for UPDATE */}
            {type === "UPDATE" && (
              <div className="flex items-center gap-2 mb-1.5">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowOnlyChanges(!showOnlyChanges);
                  }}
                  className={`text-[9px] px-1.5 py-0.5 rounded transition-colors ${
                    showOnlyChanges
                      ? 'bg-[var(--accent-purple)]/20 text-[var(--accent-purple)]'
                      : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'
                  }`}
                >
                  {showOnlyChanges ? "Changed only" : "All columns"}
                </button>
              </div>
            )}
            <DiffViewer
              before={before}
              after={after}
              type={type}
              showOnlyChanges={type === "UPDATE" && showOnlyChanges}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}




