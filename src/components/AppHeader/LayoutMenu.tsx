import { useState } from "react";
import { LayoutGrid, PanelRightOpen, PanelBottomOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { EventLogPosition, LayoutSettings } from "../types";

interface LayoutMenuProps {
  layoutSettings: LayoutSettings;
  onEventLogPositionChange: (position: EventLogPosition) => void;
}

export function LayoutMenu({
  layoutSettings,
  onEventLogPositionChange,
}: LayoutMenuProps) {
  const [showLayoutMenu, setShowLayoutMenu] = useState(false);

  const setEventLogPosition = (position: EventLogPosition) => {
    onEventLogPositionChange(position);
    setShowLayoutMenu(false);
  };

  return (
    <div className="relative flex items-center">
      <button
        onClick={() => setShowLayoutMenu(!showLayoutMenu)}
        className="p-1.5 hover:bg-[var(--bg-tertiary)] rounded-md transition-colors flex items-center justify-center"
        title="Layout settings"
      >
        <LayoutGrid className="w-4 h-4 text-[var(--text-secondary)]" />
      </button>

      {/* Layout Menu Dropdown */}
      <AnimatePresence>
        {showLayoutMenu && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 top-full mt-1 w-48 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg shadow-xl z-50 py-1"
          >
            <div className="px-3 py-1.5 text-[10px] font-medium text-[var(--text-secondary)] uppercase">
              Event Log Position
            </div>
            <button
              onClick={() => setEventLogPosition("right")}
              className={`w-full px-3 py-1.5 text-xs text-left hover:bg-[var(--bg-tertiary)] flex items-center gap-2 ${
                layoutSettings.eventLogPosition === "right" ? "text-[var(--accent-purple)]" : ""
              }`}
            >
              <PanelRightOpen className="w-4 h-4" />
              Right Panel
              {layoutSettings.eventLogPosition === "right" && <span className="ml-auto">✓</span>}
            </button>
            <button
              onClick={() => setEventLogPosition("bottom")}
              className={`w-full px-3 py-1.5 text-xs text-left hover:bg-[var(--bg-tertiary)] flex items-center gap-2 ${
                layoutSettings.eventLogPosition === "bottom" ? "text-[var(--accent-purple)]" : ""
              }`}
            >
              <PanelBottomOpen className="w-4 h-4" />
              Bottom Panel
              {layoutSettings.eventLogPosition === "bottom" && <span className="ml-auto">✓</span>}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

