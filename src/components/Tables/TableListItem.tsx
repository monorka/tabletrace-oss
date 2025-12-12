/**
 * Table List Item Component
 */

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Table2, Eye, EyeOff, FlaskConical } from "lucide-react";
import { TableListItemProps } from "../../types";
import { cn } from "../../lib/utils";

export function TableListItem({
  schema: _schema,
  name,
  columnCount,
  isWatched,
  isSelected,
  changes,
  statsChange,
  onSelect: _onSelect,
  onToggleWatch,
  showDryRunIcon,
  isDryRunTarget,
  onSetDryRunTarget
}: TableListItemProps) {
  // Flash color based on change type (only for non-watched tables)
  const getFlashColor = () => {
    if (!statsChange || isWatched) return null;
    switch (statsChange.changeType) {
      case "insert": return "rgb(var(--accent-green))";
      case "update": return "rgb(var(--accent-yellow))";
      case "delete": return "rgb(var(--accent-red))";
      default: return "rgb(var(--accent-yellow))";
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

  // In dry run mode, clicking selects for dry run instead of toggling watch
  const handleClick = () => {
    if (showDryRunIcon) {
      onSetDryRunTarget?.();
    } else {
      onToggleWatch();
    }
  };

  return (
    <div
      className={cn(
        "group flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer transition-colors",
        showDryRunIcon
          ? (isDryRunTarget ? "bg-accent-purple/10" : "hover:bg-secondary")
          : (isWatched ? "bg-accent-green/10" : "hover:bg-secondary"),
        isSelected && "ring-1 ring-accent-purple"
      )}
      onClick={handleClick}
      title={showDryRunIcon
        ? (isDryRunTarget ? "Selected for Dry Run" : "Select for Dry Run")
        : (isWatched ? "Stop watching" : statsChange ? `Changed: +${statsChange.insertDelta} ~${statsChange.updateDelta} -${statsChange.deleteDelta}` : "Watch table")
      }
      style={!showDryRunIcon && flashColor && opacity > 0 ? {
        backgroundColor: `color-mix(in srgb, ${flashColor} ${Math.round(opacity * 100)}%, transparent)`,
      } : {}}
    >
      <div className="flex items-center gap-2 min-w-0">
        <Table2 className={cn("w-3.5 h-3.5 shrink-0", isWatched ? "text-accent-green" : "text-muted-foreground")} />
        <div className="min-w-0">
          <span className="text-xs truncate block">{name}</span>
          <span className="text-[10px] text-muted-foreground">{columnCount} cols</span>
        </div>
      </div>
      <div className="flex items-center gap-1">
        {/* Change count badge (hidden in dry run mode) */}
        {!showDryRunIcon && changes > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent-purple/20 text-accent-purple"
          >
            {changes}
          </motion.span>
        )}
        {/* Dry Run Target Icon (only shown in dry run tab) */}
        {showDryRunIcon ? (
          <div
            className={cn(
              "p-1 rounded transition-colors",
              isDryRunTarget
                ? "text-accent-purple"
                : "text-muted-foreground opacity-0 group-hover:opacity-100"
            )}
          >
            <FlaskConical className="w-3.5 h-3.5" />
          </div>
        ) : (
          /* Watch Icon (hidden in dry run tab) */
          <div
            className={cn(
              "p-1 rounded transition-colors",
              isWatched
                ? "text-accent-green"
                : "text-muted-foreground opacity-0 group-hover:opacity-100"
            )}
          >
            {isWatched ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </div>
        )}
      </div>
    </div>
  );
}




