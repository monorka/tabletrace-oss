import { getLimit } from "@/config";

// ===== Helper Functions =====
// Helper to get max display rows from settings (user override or config default)
export const getMaxDisplayRows = (): number => {
  try {
    const saved = localStorage.getItem("tabletrace-settings");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (typeof parsed.maxDisplayRows === "number" && parsed.maxDisplayRows >= 1) {
        // Respect config limit
        return Math.min(getLimit('maxPollingRows'), parsed.maxDisplayRows);
      }
    }
  } catch {
    // ignore
  }
  return getLimit('maxDisplayRows'); // default from config
};

// Get max events from config
export const getMaxEvents = (): number => {
  return getLimit('maxEvents');
};
