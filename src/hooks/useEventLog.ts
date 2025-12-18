/**
 * Custom hook for Event Log expanded state management
 */

import { useState } from "react";

export function useEventLog() {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const clearExpanded = () => {
    setExpandedIds(new Set());
  };

  return {
    expandedIds,
    toggleExpanded,
    clearExpanded
  };
}

