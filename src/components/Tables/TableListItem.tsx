/**
 * Table List Item Component
 */

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Table2, Eye, EyeOff } from "lucide-react";
import { TableListItemProps } from "../../types";

export function TableListItem({
  schema: _schema,
  name,
  columnCount,
  isWatched,
  isSelected,
  changes,
  statsChange,
  onSelect: _onSelect,
  onToggleWatch
}: TableListItemProps) {
  // Flash color based on change type (only for non-watched tables)
  const getFlashColor = () => {
    if (!statsChange || isWatched) return null;
    switch (statsChange.changeType) {
      case "insert": return "var(--accent-green)";
      case "update": return "var(--accent-yellow)";
      case "delete": return "var(--accent-red)";
      default: return "var(--accent-yellow)";
    }
  };

  const flashColor = getFlashColor();

  const [opacity, setOpacity] = useState(0);

  // Update opacity periodically for smooth fade (2 second fade out)
  React.useEffect(() => {
    if (!statsChange || isWatched) {
      setOpacity(0);
      return;
    }

    const calcOpacity = () => {
      const elapsed = Date.now() - statsChange.detectedAt;
      const remaining = Math.max(0, 2000 - elapsed);
      return (remaining / 2000) * 0.3; // Max 30% opacity, fades to 0
    };

    setOpacity(calcOpacity());
    const interval = setInterval(() => {
      const newOpacity = calcOpacity();
      setOpacity(newOpacity);
      if (newOpacity <= 0) {
        clearInterval(interval);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [statsChange, isWatched]);

  return (
    <div
      className={`
        group flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer transition-colors
        ${isWatched ? "bg-[var(--accent-green)]/10" : "hover:bg-[var(--bg-tertiary)]"}
        ${isSelected ? "ring-1 ring-[var(--accent-purple)]" : ""}
      `}
      onClick={onToggleWatch}
      title={isWatched ? "Stop watching" : statsChange ? `Changed: +${statsChange.insertDelta} ~${statsChange.updateDelta} -${statsChange.deleteDelta}` : "Watch table"}
      style={flashColor && opacity > 0 ? {
        backgroundColor: `color-mix(in srgb, ${flashColor} ${Math.round(opacity * 100)}%, transparent)`,
      } : {}}
    >
      <div className="flex items-center gap-2 min-w-0">
        <Table2 className={`w-3.5 h-3.5 flex-shrink-0 ${isWatched ? "text-[var(--accent-green)]" : "text-[var(--text-secondary)]"}`} />
        <div className="min-w-0">
          <span className="text-xs truncate block">{name}</span>
          <span className="text-[10px] text-[var(--text-secondary)]">{columnCount} cols</span>
        </div>
      </div>
      <div className="flex items-center gap-1">
        {changes > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--accent-purple)]/20 text-[var(--accent-purple)]"
          >
            {changes}
          </motion.span>
        )}
        <div
          className={`
            p-1 rounded transition-colors
            ${isWatched
              ? "text-[var(--accent-green)]"
              : "text-[var(--text-secondary)] opacity-0 group-hover:opacity-100"
            }
          `}
        >
          {isWatched ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
        </div>
      </div>
    </div>
  );
}




