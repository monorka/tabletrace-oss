/**
 * Diff calculation utilities
 */

import type { DiffResult } from "../types";

// ===== Pure Functions =====
// Calculate diff between before and after
export function calculateDiff(before?: Record<string, unknown>, after?: Record<string, unknown>): DiffResult[] {
  const keys = new Set([
    ...Object.keys(before || {}),
    ...Object.keys(after || {})
  ]);

  return [...keys].map((key) => {
    const b = before?.[key];
    const a = after?.[key];
    const bStr = JSON.stringify(b);
    const aStr = JSON.stringify(a);

    return {
      key,
      before: b,
      after: a,
      changed: bStr !== aStr,
      type: b === undefined ? "added"
        : a === undefined ? "removed"
        : bStr !== aStr ? "modified"
        : "unchanged",
    };
  });
}
