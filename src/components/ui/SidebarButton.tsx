/**
 * Sidebar navigation button component
 */

import React from "react";
import { motion } from "framer-motion";

interface SidebarButtonProps {
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
  tooltip: string;
  highlight?: boolean;
}

export function SidebarButton({
  icon,
  active,
  onClick,
  tooltip,
  highlight
}: SidebarButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        relative p-2 rounded-lg transition-all duration-200 group
        ${active
          ? "bg-[var(--accent-purple)]/20 text-[var(--accent-purple)]"
          : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"
        }
        ${highlight ? "ring-1 ring-[var(--accent-purple)]/50" : ""}
      `}
      title={tooltip}
    >
      {icon}
      {active && (
        <motion.div
          layoutId="sidebar-indicator"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-[var(--accent-purple)] rounded-r"
        />
      )}
    </button>
  );
}




