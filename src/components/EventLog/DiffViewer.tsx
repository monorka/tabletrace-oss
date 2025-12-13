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
      <div className="text-[10px] text-muted-foreground text-center py-2">
        No changes to display
      </div>
    );
  }

  return (
    <div className="text-[10px] bg-card rounded overflow-x-auto">
      <table className="w-full min-w-max">
        <thead>
          <tr className="bg-secondary">
            <th className="px-2 py-1 text-left font-medium text-muted-foreground">Column</th>
            {type !== "INSERT" && (
              <th className="px-2 py-1 text-left font-medium text-accent-red">Before</th>
            )}
            {type !== "DELETE" && (
              <th className="px-2 py-1 text-left font-medium text-accent-green">After</th>
            )}
          </tr>
        </thead>
        <tbody>
          {filteredDiff.map((d) => (
            <tr
              key={d.key}
              className={`border-t border-border ${
                d.changed ? 'bg-accent-yellow/5' : ''
              }`}
            >
              <td className={`px-2 py-1 font-medium ${d.changed ? 'text-accent-yellow' : 'text-muted-foreground'}`}>
                {d.changed && <span className="mr-1">●</span>}
                {d.key}
              </td>
              {type !== "INSERT" && (
                <td className={`px-2 py-1 whitespace-nowrap ${d.type === 'removed' || d.type === 'modified' ? 'text-accent-red' : 'text-muted-foreground'}`}>
                  {formatDiffValue(d.before)}
                </td>
              )}
              {type !== "DELETE" && (
                <td className={`px-2 py-1 whitespace-nowrap ${d.type === 'added' || d.type === 'modified' ? 'text-accent-green' : 'text-muted-foreground'}`}>
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




