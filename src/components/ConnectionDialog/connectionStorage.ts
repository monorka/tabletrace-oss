import { SavedConnection } from "./types";

// Load/save connection from localStorage
const STORAGE_KEY = "tabletrace-last-connection";

export const loadSavedConnection = (): SavedConnection | null => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error("Failed to load saved connection:", e);
  }
  return null;
};

export const saveConnection = (connection: SavedConnection) => {
  try {
    // Don't save password for security
    const { password: _, ...configWithoutPassword } = connection.config;
    const safeConnection = {
      ...connection,
      config: { ...configWithoutPassword, password: "" }
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(safeConnection));
  } catch (e) {
    console.error("Failed to save connection:", e);
  }
};

