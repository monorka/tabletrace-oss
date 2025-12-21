import { tauriCommands } from "@/lib/tauri";
import { getMaxDisplayRows } from "../connection/helpers";
import type { ConnectionState } from "../connection/connectionState";

// ===== Table Watching Actions =====
// Table watching actions extracted from connectionStore

export const createWatchingActions = (
  set: (partial: Partial<ConnectionState> | ((state: ConnectionState) => Partial<ConnectionState>)) => void,
  get: () => ConnectionState
) => ({
  // Start watching a table
  startWatching: async (schema: string, table: string) => {
    const fullName = `${schema}.${table}`;
    const { watchedTables, watchedTableData } = get();

    if (watchedTables.includes(fullName)) {
      return; // Already watching
    }

    try {
      // Initialize table data
      const newData = new Map(watchedTableData);
      newData.set(fullName, {
        schema,
        table,
        columns: [],
        rows: [],
        rowCount: 0,
        highlightedRows: new Map(),
        loading: true,
      });
      set({ watchedTableData: newData });

      await tauriCommands.startWatching({ schema, table });
      set({ watchedTables: [...watchedTables, fullName] });

      // Load initial data
      await get().refreshWatchedTable(schema, table);

      console.log(`Started watching ${fullName}`);
    } catch (error) {
      console.error(`Failed to start watching ${fullName}:`, error);
      // Remove from data on error
      const newData = new Map(get().watchedTableData);
      newData.delete(fullName);
      set({ watchedTableData: newData });
      throw error;
    }
  },

  // Stop watching a table
  stopWatching: async (schema: string, table: string) => {
    const fullName = `${schema}.${table}`;
    const { watchedTables, watchedTableData } = get();

    try {
      await tauriCommands.stopWatching({ schema, table });

      // Remove from watched tables
      set({ watchedTables: watchedTables.filter((t) => t !== fullName) });

      // Remove data
      const newData = new Map(watchedTableData);
      newData.delete(fullName);
      set({ watchedTableData: newData });

      console.log(`Stopped watching ${fullName}`);
    } catch (error) {
      console.error(`Failed to stop watching ${fullName}:`, error);
    }
  },

  // Refresh watched table data
  refreshWatchedTable: async (schema: string, table: string) => {
    const fullName = `${schema}.${table}`;
    const maxRows = getMaxDisplayRows();

    try {
      const [columns, rows, rowCount] = await Promise.all([
        tauriCommands.getColumns({ schema, table }),
        tauriCommands.getRows({ schema, table, limit: maxRows, offset: 0 }),
        tauriCommands.getRowCount({ schema, table }),
      ]);

      // Get current state AFTER async operations to preserve any highlights added during fetch
      const currentData = get().watchedTableData;
      const existing = currentData.get(fullName);

      const newData = new Map(currentData);
      newData.set(fullName, {
        schema,
        table,
        columns,
        rows,
        rowCount,
        highlightedRows: existing?.highlightedRows ? new Map(existing.highlightedRows) : new Map(),
        loading: false,
      });
      set({ watchedTableData: newData });
    } catch (error) {
      console.error(`Failed to refresh ${fullName}:`, error);
    }
  },
});
