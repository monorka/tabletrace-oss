import { listenToChanges } from "../../lib/tauri/events";
import type { TableChange } from "../../lib/tauri/types";
import type { ConnectionState } from "../connection/connectionState";

// ===== Event Management Actions =====
// Event management actions extracted from connectionStore

export const createEventActions = (
  set: (partial: Partial<ConnectionState> | ((state: ConnectionState) => Partial<ConnectionState>)) => void,
  get: () => ConnectionState
) => ({
  // Add a new event
  addEvent: (event: TableChange) => {
    const fullName = `${event.schema}.${event.table}`;
    const { watchedTables } = get();

    set((state) => {
      const newEvents = [event, ...state.events];
      // Keep only maxEvents
      if (newEvents.length > state.maxEvents) {
        newEvents.pop();
      }
      return { events: newEvents };
    });

    // Refresh table data if being watched
    if (watchedTables.includes(fullName)) {
      get().refreshWatchedTable(event.schema, event.table);
    }

    // Refresh selected table if it matches
    const { selectedTable } = get();
    if (selectedTable &&
        selectedTable.schema === event.schema &&
        selectedTable.table === event.table) {
      get().selectTable(event.schema, event.table);
    }
  },

  // Clear all events
  clearEvents: () => {
    set({ events: [] });
  },

  // Setup event listener for database changes
  setupEventListener: async () => {
    try {
      const unlistenFn = await listenToChanges((change: TableChange) => {
        console.log("Received change:", change);
        get().addEvent(change);
      });

      set({ unlistenFn });
      console.log("Event listener setup complete");
    } catch (error) {
      console.error("Failed to setup event listener:", error);
    }
  },

  // Cleanup event listener
  cleanupEventListener: () => {
    const { unlistenFn } = get();
    if (unlistenFn) {
      unlistenFn();
      set({ unlistenFn: undefined });
      console.log("Event listener cleaned up");
    }
  },
});
