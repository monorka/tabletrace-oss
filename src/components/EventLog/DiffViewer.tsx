/**
 * Diff Viewer Component - shows before/after comparison
 */

import { calculateDiff, formatDiffValue } from "../../utils";

interface DiffViewerProps {
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  type: "INSERT" | "UPDATE" | "DELETE";
  showOnlyChanges?: boolean;
}

export function DiffViewer({
  before,
  after,
  type,
  showOnlyChanges = false
}: DiffViewerProps) {
  const diff = calculateDiff(before, after);
  const filteredDiff = showOnlyChanges ? diff.filter(d => d.changed) : diff;

  if (filteredDiff.length === 0) {
    return (
      <div className="text-[10px] text-[var(--text-secondary)] text-center py-2">
        No changes to display
      </div>
    );
  }

  return (
    <div className="text-[10px] bg-[var(--bg-primary)] rounded overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-[var(--bg-tertiary)]">
            <th className="px-2 py-1 text-left font-medium text-[var(--text-secondary)]">Column</th>
            {type !== "INSERT" && (
              <th className="px-2 py-1 text-left font-medium text-[var(--accent-red)]">Before</th>
            )}
            {type !== "DELETE" && (
              <th className="px-2 py-1 text-left font-medium text-[var(--accent-green)]">After</th>
            )}
          </tr>
        </thead>
        <tbody>
          {filteredDiff.map((d) => (
            <tr
              key={d.key}
              className={`border-t border-[var(--border-color)] ${
                d.changed ? 'bg-[var(--accent-yellow)]/5' : ''
              }`}
            >
              <td className={`px-2 py-1 font-medium ${d.changed ? 'text-[var(--accent-yellow)]' : 'text-[var(--text-secondary)]'}`}>
                {d.changed && <span className="mr-1">●</span>}
                {d.key}
              </td>
              {type !== "INSERT" && (
                <td className={`px-2 py-1 max-w-[80px] truncate ${d.type === 'removed' || d.type === 'modified' ? 'text-[var(--accent-red)]' : 'text-[var(--text-secondary)]'}`}>
                  {formatDiffValue(d.before)}
                </td>
              )}
              {type !== "DELETE" && (
                <td className={`px-2 py-1 max-w-[80px] truncate ${d.type === 'added' || d.type === 'modified' ? 'text-[var(--accent-green)]' : 'text-[var(--text-secondary)]'}`}>
                  {formatDiffValue(d.after)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}




