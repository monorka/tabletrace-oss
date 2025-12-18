/**
 * Theme utilities for managing theme state
 */

import { Theme } from "../types";

/**
 * Apply theme to the document
 */
export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  
  if (theme === "system") {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (prefersDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  } else if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

/**
 * Get effective theme (resolves "system" to actual theme)
 */
export function getEffectiveTheme(theme: Theme): "light" | "dark" {
  if (theme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return theme;
}

/**
 * Initialize theme on app load
 * @returns Cleanup function to remove event listener (only when theme is "system")
 */
export function initializeTheme(theme: Theme): (() => void) | void {
  applyTheme(theme);
  
  // Listen for system theme changes when theme is set to "system"
  if (theme === "system") {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      applyTheme("system");
    };
    mediaQuery.addEventListener("change", handleChange);
    
    // Return cleanup function (though we don't use it in this simple implementation)
    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }
}

