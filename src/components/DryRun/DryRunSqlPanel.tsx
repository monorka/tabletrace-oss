/**
 * Dry Run SQL Input Panel Component
 */

import { FlaskConical, Loader2, Play, AlertCircle, CheckCircle2 } from "lucide-react";
import { DryRunSqlPanelProps } from "../../types";

export function DryRunSqlPanel({ sql, setSql, isRunning, result, onRun, isBottom = false }: DryRunSqlPanelProps) {
  return (
    <div className={`${isBottom ? "h-64 border-t" : "w-80 border-l"} border-[var(--border-color)] bg-[var(--bg-secondary)] flex ${isBottom ? "flex-row" : "flex-col"}`}>
      {/* SQL Input Section */}
      <div className={`${isBottom ? 'w-1/2 border-r' : 'flex-1'} border-[var(--border-color)] flex flex-col`}>
        {/* Header */}
        <div className="p-3 border-b border-[var(--border-color)] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-[var(--accent-cyan)]" />
            <h2 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
              SQL Preview
            </h2>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--accent-cyan)]/20 text-[var(--accent-cyan)]">
            Dry Run
          </span>
        </div>

        {/* SQL Input */}
        <div className="flex-1 p-2 flex flex-col min-h-0">
          <textarea
            value={sql}
            onChange={(e) => setSql(e.target.value)}
            placeholder={`-- SQL Preview Examples
INSERT INTO users (name)
VALUES ('test');

UPDATE users SET name='new'
WHERE id=1;

DELETE FROM users
WHERE id=1;`}
            className="flex-1 w-full px-3 py-2 rounded bg-[var(--bg-primary)] border border-[var(--border-color)]
                       text-xs font-mono resize-none focus:outline-none focus:border-[var(--accent-cyan)]
                       placeholder:text-[var(--text-secondary)]/50"
            spellCheck={false}
          />
        </div>

        {/* Preview Button */}
        <div className="px-2 py-2 flex-shrink-0">
          <button
            onClick={onRun}
            disabled={isRunning || !sql.trim()}
            className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded text-xs font-medium transition-colors
              ${isRunning || !sql.trim()
                ? "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] cursor-not-allowed"
                : "bg-[var(--accent-cyan)] text-white hover:bg-[var(--accent-cyan)]/80"
              }`}
          >
            {isRunning ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                Preview Changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* Change Log Section */}
      <div className={`${isBottom ? 'w-1/2' : 'flex-1 border-t'} border-[var(--border-color)] flex flex-col`}>
        {/* Header for bottom mode */}
        {isBottom && (
          <div className="p-3 border-b border-[var(--border-color)] flex items-center gap-2 flex-shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5 text-[var(--accent-green)]" />
            <h2 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
              Change Log
            </h2>
          </div>
        )}

        {/* Change Log Content */}
        <div className="flex-1 overflow-auto">
          {!result ? (
            <div className="h-full flex items-center justify-center text-[var(--text-secondary)]">
              <div className="text-center py-4">
                <FlaskConical className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-[10px]">Run preview to see changes</p>
              </div>
            </div>
          ) : result.error ? (
            <div className="p-2">
              <div className="p-2 rounded bg-[var(--accent-red)]/10 text-[10px]">
                <div className="flex items-center gap-1 text-[var(--accent-red)] font-medium mb-1">
                  <AlertCircle className="w-3 h-3" />
                  Error
                </div>
                <p className="text-[var(--text-secondary)] font-mono break-all">{result.error}</p>
              </div>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {/* Summary header */}
              <div className="flex items-center justify-between px-1 pb-1 border-b border-[var(--border-color)]/30">
                <div className="flex items-center gap-1 text-[10px]">
                  <CheckCircle2 className="w-3 h-3 text-[var(--accent-green)]" />
                  <span className="font-medium">{result.changes.length} changes</span>
                </div>
                <div className="flex gap-1 text-[9px]">
                  {result.changes.filter(c => c.type === "INSERT").length > 0 && (
                    <span className="text-[var(--accent-green)]">+{result.changes.filter(c => c.type === "INSERT").length}</span>
                  )}
                  {result.changes.filter(c => c.type === "UPDATE").length > 0 && (
                    <span className="text-[var(--accent-yellow)]">~{result.changes.filter(c => c.type === "UPDATE").length}</span>
                  )}
                  {result.changes.filter(c => c.type === "DELETE").length > 0 && (
                    <span className="text-[var(--accent-red)]">-{result.changes.filter(c => c.type === "DELETE").length}</span>
                  )}
                </div>
              </div>

              {/* Change log items */}
              {result.changes.map((change, idx) => (
                <div
                  key={idx}
                  className={`px-2 py-1.5 rounded text-[10px] ${
                    change.type === "INSERT" ? "bg-[var(--accent-green)]/10" :
                    change.type === "UPDATE" ? "bg-[var(--accent-yellow)]/10" :
                    "bg-[var(--accent-red)]/10"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${
                      change.type === "INSERT" ? "text-[var(--accent-green)]" :
                      change.type === "UPDATE" ? "text-[var(--accent-yellow)]" :
                      "text-[var(--accent-red)]"
                    }`}>
                      {change.type === "INSERT" ? "+" : change.type === "UPDATE" ? "~" : "-"}
                    </span>
                    <span className="text-[var(--text-secondary)]">{change.table}</span>
                    <span className="text-[var(--text-secondary)]/50 text-[9px]">{change.schema}</span>
                  </div>
                  {/* Show key info if available */}
                  {(change.before || change.after) && (
                    <div className="mt-1 pl-4 text-[9px] font-mono text-[var(--text-secondary)]/70 truncate">
                      {change.type === "DELETE" && change.before && (
                        <span>id: {JSON.stringify(Object.values(change.before)[0])}</span>
                      )}
                      {change.type === "INSERT" && change.after && (
                        <span>id: {JSON.stringify(Object.values(change.after)[0])}</span>
                      )}
                      {change.type === "UPDATE" && change.after && (
                        <span>id: {JSON.stringify(Object.values(change.after)[0])}</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
