/**
 * Types for SettingsDialog components
 */

export interface UpdateState {
  checking: boolean;
  available: boolean;
  version?: string;
  downloading: boolean;
  progress: number;
  error?: string;
}

