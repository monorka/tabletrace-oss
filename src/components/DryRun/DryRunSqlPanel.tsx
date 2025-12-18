/**
 * Dry Run SQL Input Panel Component
 */

import { FlaskConical, Loader2, Play, AlertCircle, CheckCircle2 } from "lucide-react";
import { DryRunSqlPanelProps } from "../../types";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";
import { cn } from "../../lib/utils";

export function DryRunSqlPanel({ sql, setSql, isRunning, result, onRun, isBottom = false }: DryRunSqlPanelProps) {
  return (
    <div className={cn(
      isBottom ? "h-64 border-t" : "w-80 border-l",
      "border-border bg-secondary flex",
      isBottom ? "flex-row" : "flex-col"
    )}>
      {/* SQL Input Section */}
      <div className={cn(
        isBottom ? 'w-1/2 border-r' : 'flex-1',
        "border-border flex flex-col"
      )}>
        {/* Header */}
        <div className="h-12 p-3 border-b border-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-accent-cyan" />
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              SQL Preview
            </h2>
          </div>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 bg-accent-cyan/20 text-accent-cyan border-accent-cyan/30">
            Dry Run
          </Badge>
        </div>

        {/* SQL Input */}
        <div className="flex-1 p-2 flex flex-col min-h-0">
          <Textarea
            value={sql}
            onChange={(e) => setSql(e.target.value)}
            placeholder={`-- SQL Preview Examples
INSERT INTO users (name)
VALUES ('test');

UPDATE users SET name='new'
WHERE id=1;

DELETE FROM users
WHERE id=1;`}
            className="flex-1 w-full text-xs font-mono resize-none"
            spellCheck={false}
          />
        </div>

        {/* Preview Button */}
        <div className="px-2 py-2 shrink-0">
          <Button
            onClick={onRun}
            disabled={isRunning || !sql.trim()}
            className="w-full text-xs"
            size="sm"
            variant={isRunning || !sql.trim() ? "secondary" : "default"}
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
          </Button>
        </div>
      </div>

      {/* Change Log Section */}
      <div className={cn(
        isBottom ? 'w-1/2' : 'flex-1 border-t',
        "border-border flex flex-col"
      )}>
        {/* Header for bottom mode */}
        {isBottom && (
          <div className="p-3 border-b border-border flex items-center gap-2 shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5 text-accent-green" />
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Change Log
            </h2>
          </div>
        )}

        {/* Change Log Content */}
        <div className="flex-1 overflow-auto">
          {!result ? (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <div className="text-center py-4">
                <FlaskConical className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-[10px]">Run preview to see changes</p>
              </div>
            </div>
          ) : result.error ? (
            <div className="p-2">
              <div className="p-2 rounded bg-accent-red/10 text-[10px] border border-accent-red/20">
                <div className="flex items-center gap-1 text-accent-red font-medium mb-1">
                  <AlertCircle className="w-3 h-3" />
                  Error
                </div>
                <p className="text-muted-foreground font-mono break-all">{result.error}</p>
              </div>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {/* Summary header */}
              <div className="flex items-center justify-between px-1 pb-1 border-b border-border/30">
                <div className="flex items-center gap-1 text-[10px]">
                  <CheckCircle2 className="w-3 h-3 text-accent-green" />
                  <span className="font-medium">{result.changes.length} changes</span>
                </div>
                <div className="flex gap-1 text-[9px]">
                  {result.changes.filter(c => c.type === "INSERT").length > 0 && (
                    <span className="text-accent-green">+{result.changes.filter(c => c.type === "INSERT").length}</span>
                  )}
                  {result.changes.filter(c => c.type === "UPDATE").length > 0 && (
                    <span className="text-accent-yellow">~{result.changes.filter(c => c.type === "UPDATE").length}</span>
                  )}
                  {result.changes.filter(c => c.type === "DELETE").length > 0 && (
                    <span className="text-accent-red">-{result.changes.filter(c => c.type === "DELETE").length}</span>
                  )}
                </div>
              </div>

              {/* Change log items */}
              {result.changes.map((change, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "px-2 py-1.5 rounded text-[10px]",
                    change.type === "INSERT" && "bg-accent-green/10",
                    change.type === "UPDATE" && "bg-accent-yellow/10",
                    change.type === "DELETE" && "bg-accent-red/10"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "font-medium",
                      change.type === "INSERT" && "text-accent-green",
                      change.type === "UPDATE" && "text-accent-yellow",
                      change.type === "DELETE" && "text-accent-red"
                    )}>
                      {change.type === "INSERT" ? "+" : change.type === "UPDATE" ? "~" : "-"}
                    </span>
                    <span className="text-muted-foreground">{change.table}</span>
                    <span className="text-muted-foreground/50 text-[9px]">{change.schema}</span>
                  </div>
                  {/* Show key info if available */}
                  {(change.before || change.after) && (
                    <div className="mt-1 pl-4 text-[9px] font-mono text-muted-foreground/70 truncate">
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
