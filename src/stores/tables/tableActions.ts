import { tauriCommands } from "../../lib/tauri";
import { getMaxDisplayRows } from "../connection/helpers";
import type { ConnectionState } from "../connection/connectionState";
import type { StatsChangeType, TableChangeInfo } from "../connection/types";
import type { TableStats } from "../../lib/tauri/types";

// ===== Schema and Table Management Actions =====
// Schema and table management actions extracted from connectionStore

export const createTableActions = (
  set: (partial: Partial<ConnectionState> | ((state: ConnectionState) => Partial<ConnectionState>)) => void,
  get: () => ConnectionState
) => ({
  // Refresh table list
  refreshTables: async () => {
    try {
      const [tables, foreignKeys] = await Promise.all([
        tauriCommands.getTables(),
        tauriCommands.getForeignKeys(),
      ]);
      set({ tables, foreignKeys });
    } catch (error) {
      console.error("Failed to refresh tables:", error);
    }
  },

  // Refresh table stats (lightweight change detection)
  refreshTableStats: async () => {
    try {
      const stats = await tauriCommands.getTableStats();
      const { tableStats: prevStats, tablesWithChanges: existingChanges } = get();

      const now = Date.now();
      const CHANGE_RETENTION_MS = 2000; // Flash for 2 seconds

      // Filter out old changes
      const recentChanges = existingChanges.filter(c => now - c.detectedAt < CHANGE_RETENTION_MS);

      // Helper to determine dominant change type
      const getChangeType = (ins: number, upd: number, del: number): StatsChangeType => {
        if (ins > 0 && upd === 0 && del === 0) return "insert";
        if (upd > 0 && ins === 0 && del === 0) return "update";
        if (del > 0 && ins === 0 && upd === 0) return "delete";
        // Mixed - return the dominant one
        if (ins >= upd && ins >= del) return "insert";
        if (upd >= ins && upd >= del) return "update";
        return "delete";
      };

      // Compare with previous stats to detect new changes
      const newChanges: TableChangeInfo[] = [];
      const newStats = new Map<string, TableStats>();

      for (const stat of stats) {
        const key = `${stat.schema}.${stat.table}`;
        newStats.set(key, stat);

        const prev = prevStats.get(key);
        if (prev) {
          const insertDelta = stat.n_tup_ins - prev.n_tup_ins;
          const updateDelta = stat.n_tup_upd - prev.n_tup_upd;
          const deleteDelta = stat.n_tup_del - prev.n_tup_del;
          const totalDelta = insertDelta + updateDelta + deleteDelta;

          if (totalDelta > 0) {
            // Check if this table already has a recent change entry
            const existingIdx = recentChanges.findIndex(c => c.schema === stat.schema && c.table === stat.table);

            if (existingIdx >= 0) {
              // Update existing entry - refresh timestamp to extend flash
              const existing = recentChanges[existingIdx];
              const newIns = existing.insertDelta + insertDelta;
              const newUpd = existing.updateDelta + updateDelta;
              const newDel = existing.deleteDelta + deleteDelta;
              recentChanges[existingIdx] = {
                ...existing,
                insertDelta: newIns,
                updateDelta: newUpd,
                deleteDelta: newDel,
                totalDelta: existing.totalDelta + totalDelta,
                changeType: getChangeType(newIns, newUpd, newDel),
                detectedAt: now,
              };
            } else {
              // Add new change entry
              newChanges.push({
                schema: stat.schema,
                table: stat.table,
                insertDelta,
                updateDelta,
                deleteDelta,
                totalDelta,
                changeType: getChangeType(insertDelta, updateDelta, deleteDelta),
                detectedAt: now,
              });
            }
          }
        }
      }

      // Combine recent changes with new changes
      const allChanges = [...recentChanges, ...newChanges];

      set({ tableStats: newStats, tablesWithChanges: allChanges });
    } catch (error) {
      console.error("Failed to refresh table stats:", error);
    }
  },

  // Start stats polling
  startStatsPolling: () => {
    const { statsIntervalId } = get();
    if (statsIntervalId) return; // Already polling

    // Initial fetch
    get().refreshTableStats();

    // Poll every 2 seconds
    const intervalId = setInterval(() => {
      get().refreshTableStats();
    }, 2000);

    set({ statsIntervalId: intervalId });
  },

  // Stop stats polling
  stopStatsPolling: () => {
    const { statsIntervalId } = get();
    if (statsIntervalId) {
      clearInterval(statsIntervalId);
      set({ statsIntervalId: undefined, tablesWithChanges: [] });
    }
  },

  // Select a table to view details
  selectTable: async (schema: string, table: string) => {
    set({
      selectedTable: { schema, table },
      selectedTableColumns: [],
      selectedTableRows: [],
      selectedTableRowCount: 0,
    });

    const maxRows = getMaxDisplayRows();

    try {
      const [columns, rows, rowCount] = await Promise.all([
        tauriCommands.getColumns({ schema, table }),
        tauriCommands.getRows({ schema, table, limit: maxRows, offset: 0 }),
        tauriCommands.getRowCount({ schema, table }),
      ]);

      set({
        selectedTableColumns: columns,
        selectedTableRows: rows,
        selectedTableRowCount: rowCount,
      });
    } catch (error) {
      console.error("Failed to load table details:", error);
    }
  },

  // Clear selected table
  clearSelectedTable: () => {
    set({
      selectedTable: undefined,
      selectedTableColumns: [],
      selectedTableRows: [],
      selectedTableRowCount: 0,
    });
  },

  // Get watched table data
  getWatchedTableData: (fullName: string) => {
    return get().watchedTableData.get(fullName);
  },
});
