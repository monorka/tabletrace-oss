/**
 * UI Store - Layout and appearance settings
 */

import { create } from "zustand";

// Types
export type EventLogPosition = "right" | "bottom";

export interface LayoutSettings {
  tableListOpen: boolean;
  eventLogPosition: EventLogPosition;
}

export interface AppSettings {
  maxDisplayRows: number;
}

interface UIState {
  // Layout
  layoutSettings: LayoutSettings;

  // App settings
  appSettings: AppSettings;

  // Actions
  setLayoutSettings: (settings: Partial<LayoutSettings>) => void;
  setAppSettings: (settings: Partial<AppSettings>) => void;
  toggleTableList: () => void;
  setEventLogPosition: (position: EventLogPosition) => void;
}

// Storage keys
const LAYOUT_STORAGE_KEY = "tabletrace-layout";
const SETTINGS_STORAGE_KEY = "tabletrace-settings";

// Default values
const defaultLayoutSettings: LayoutSettings = {
  tableListOpen: true,
  eventLogPosition: "right",
};

const defaultAppSettings: AppSettings = {
  maxDisplayRows: 1000,
};

// Load from localStorage
const loadLayoutSettings = (): LayoutSettings => {
  try {
    const saved = localStorage.getItem(LAYOUT_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        tableListOpen: typeof parsed.tableListOpen === "boolean"
          ? parsed.tableListOpen
          : defaultLayoutSettings.tableListOpen,
        eventLogPosition: parsed.eventLogPosition === "bottom"
          ? "bottom"
          : "right",
      };
    }
  } catch {
    // ignore
  }
  return defaultLayoutSettings;
};

const loadAppSettings = (): AppSettings => {
  try {
    const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        maxDisplayRows: typeof parsed.maxDisplayRows === "number" && parsed.maxDisplayRows >= 1
          ? Math.min(10000, parsed.maxDisplayRows)
          : defaultAppSettings.maxDisplayRows,
      };
    }
  } catch {
    // ignore
  }
  return defaultAppSettings;
};

// Save to localStorage
const saveLayoutSettings = (settings: LayoutSettings): void => {
  try {
    localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
};

const saveAppSettings = (settings: AppSettings): void => {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
};

/**
 * UI Store
 */
export const useUIStore = create<UIState>((set, get) => ({
  // Initial state
  layoutSettings: loadLayoutSettings(),
  appSettings: loadAppSettings(),

  // Actions
  setLayoutSettings: (settings) => {
    const newSettings = { ...get().layoutSettings, ...settings };
    saveLayoutSettings(newSettings);
    set({ layoutSettings: newSettings });
  },

  setAppSettings: (settings) => {
    const newSettings = { ...get().appSettings, ...settings };
    saveAppSettings(newSettings);
    set({ appSettings: newSettings });
  },

  toggleTableList: () => {
    const current = get().layoutSettings;
    const newSettings = { ...current, tableListOpen: !current.tableListOpen };
    saveLayoutSettings(newSettings);
    set({ layoutSettings: newSettings });
  },

  setEventLogPosition: (position) => {
    const current = get().layoutSettings;
    const newSettings = { ...current, eventLogPosition: position };
    saveLayoutSettings(newSettings);
    set({ layoutSettings: newSettings });
  },
}));

export default useUIStore;



