/**
 * Formatting utilities
 * Pure functions for formatting values
 */

// ===== Pure Functions =====
// Format timestamp to relative time
export function formatTime(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 1000) return "just now";
    if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return date.toLocaleTimeString();
  } catch {
    return timestamp;
  }
}

// Format cell value for display
export function formatCellValue(value: unknown): string {
  if (value === null) return "NULL";
  if (value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

// Format diff value for display (truncated)
export function formatDiffValue(value: unknown): string {
  if (value === null) return "NULL";
  if (value === undefined) return "—";
  if (typeof value === "object") {
    const str = JSON.stringify(value);
    return str.length > 30 ? str.slice(0, 30) + "..." : str;
  }
  const str = String(value);
  return str.length > 30 ? str.slice(0, 30) + "..." : str;
}
