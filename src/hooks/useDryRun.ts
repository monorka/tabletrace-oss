/**
 * Custom hook for Dry Run functionality
 */

import { useState, useEffect } from "react";
import { tauriCommands, DryRunResult, DryRunChange } from "../lib/tauri";

export function useDryRun() {
  const [sql, setSql] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<DryRunResult | null>(null);

  // Clear result when SQL changes
  useEffect(() => {
    if (sql.trim() === "") {
      setResult(null);
    }
  }, [sql]);

  const run = async () => {
    if (!sql.trim()) return;

    setIsRunning(true);
    setResult(null);

    try {
      const res = await tauriCommands.dryRun({ sql });
      setResult(res);
    } catch (err) {
      setResult({
        success: false,
        changes: [],
        error: err instanceof Error ? err.message : String(err),
        rows_affected: 0,
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getChangesForTable = (schema: string, table: string): DryRunChange[] => {
    if (!result?.changes) return [];
    return result.changes.filter(c => c.schema === schema && c.table === table);
  };

  const clearResult = () => {
    setResult(null);
  };

  return {
    sql,
    setSql,
    isRunning,
    result,
    run,
    getChangesForTable,
    clearResult
  };
}

