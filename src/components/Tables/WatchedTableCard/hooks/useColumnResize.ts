/**
 * Hook for managing column resizing
 */

import { useState, useEffect } from "react";

export function useColumnResize() {
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [resizing, setResizing] = useState<{ column: string; startX: number; startWidth: number } | null>(null);

  // Add global listeners when resizing
  useEffect(() => {
    if (!resizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const diff = e.clientX - resizing.startX;
      const newWidth = Math.max(60, resizing.startWidth + diff);
      setColumnWidths(prev => ({ ...prev, [resizing.column]: newWidth }));
    };

    const handleMouseUp = () => {
      setResizing(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizing]);

  const getColumnWidth = (colName: string) => columnWidths[colName] || 120;

  const startResize = (column: string, startX: number, startWidth: number) => {
    setResizing({ column, startX, startWidth });
  };

  return {
    getColumnWidth,
    startResize
  };
}

