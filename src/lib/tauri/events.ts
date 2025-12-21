import { listen, UnlistenFn } from "@tauri-apps/api/event";
import type { TableChange } from "./types";

// ===== Event Listeners =====

/**
 * Listen for database change events
 */
export const listenToChanges = async (
  callback: (change: TableChange) => void
): Promise<UnlistenFn> => {
  return listen<TableChange>("db-change", (event) => {
    callback(event.payload);
  });
};
