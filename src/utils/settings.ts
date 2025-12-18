/**
 * Settings utilities for loading/saving to localStorage
 */

import {
  LayoutSettings,
  AppSettings,
  EventLogPosition,
  Theme,
  defaultLayoutSettings,
  defaultAppSettings,
} from "../types";

// Load layout settings from localStorage
export const loadLayoutSettings = (): LayoutSettings => {
  try {
    const saved = localStorage.getItem("tabletrace-layout");
    if (saved) {
      const parsed = JSON.parse(saved);
      // Validate eventLogPosition
      const validPositions: EventLogPosition[] = ["right", "bottom"];
      const eventLogPosition = validPositions.includes(parsed.eventLogPosition)
        ? parsed.eventLogPosition
        : defaultLayoutSettings.eventLogPosition;

      return {
        tableListOpen: typeof parsed.tableListOpen === "boolean" ? parsed.tableListOpen : defaultLayoutSettings.tableListOpen,
        eventLogPosition,
      };
    }
  } catch (e) {
    console.error("Failed to load layout settings:", e);
    // Clear corrupted settings
    localStorage.removeItem("tabletrace-layout");
  }
  return defaultLayoutSettings;
};

// Save layout settings to localStorage
export const saveLayoutSettings = (settings: LayoutSettings): void => {
  try {
    localStorage.setItem("tabletrace-layout", JSON.stringify(settings));
  } catch (e) {
    console.error("Failed to save layout settings:", e);
  }
};

// Load app settings from localStorage
export const loadAppSettings = (): AppSettings => {
  try {
    const saved = localStorage.getItem("tabletrace-settings");
    if (saved) {
      const parsed = JSON.parse(saved);
      const validThemes: Theme[] = ["light", "dark", "system"];
      return {
        maxDisplayRows: typeof parsed.maxDisplayRows === "number" && parsed.maxDisplayRows >= 1 && parsed.maxDisplayRows <= 10000
          ? parsed.maxDisplayRows
          : defaultAppSettings.maxDisplayRows,
        theme: parsed.theme && validThemes.includes(parsed.theme)
          ? parsed.theme
          : defaultAppSettings.theme,
      };
    }
  } catch (e) {
    console.error("Failed to load app settings:", e);
    localStorage.removeItem("tabletrace-settings");
  }
  return defaultAppSettings;
};

// Save app settings to localStorage
export const saveAppSettings = (settings: AppSettings): void => {
  try {
    localStorage.setItem("tabletrace-settings", JSON.stringify(settings));
  } catch (e) {
    console.error("Failed to save app settings:", e);
  }
};




