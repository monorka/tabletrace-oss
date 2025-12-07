/**
 * Settings Dialog Component
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, Download, Check, RefreshCw, ExternalLink } from "lucide-react";
import { SettingsDialogProps, AppSettings, defaultAppSettings } from "../../types";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { VERSION } from "../../index";

interface UpdateState {
  checking: boolean;
  available: boolean;
  version?: string;
  downloading: boolean;
  progress: number;
  error?: string;
}

export function SettingsDialog({ isOpen, onClose, settings, onSave }: SettingsDialogProps) {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [updateState, setUpdateState] = useState<UpdateState>({
    checking: false,
    available: false,
    downloading: false,
    progress: 0,
  });

  // Reset local settings when dialog opens
  useEffect(() => {
    if (isOpen) {
      setLocalSettings(settings);
      checkForUpdates();
    }
  }, [isOpen, settings]);

  const checkForUpdates = async () => {
    setUpdateState(prev => ({ ...prev, checking: true, error: undefined }));
    try {
      const update = await check();
      if (update) {
        setUpdateState(prev => ({
          ...prev,
          checking: false,
          available: true,
          version: update.version,
        }));
      } else {
        setUpdateState(prev => ({
          ...prev,
          checking: false,
          available: false,
        }));
      }
    } catch {
      setUpdateState(prev => ({
        ...prev,
        checking: false,
        error: "Failed to check for updates",
      }));
    }
  };

  const handleUpdate = async () => {
    setUpdateState(prev => ({ ...prev, downloading: true, progress: 0 }));
    try {
      const update = await check();
      if (update) {
        let totalSize = 0;
        let downloadedSize = 0;

        await update.downloadAndInstall((event) => {
          if (event.event === "Started") {
            totalSize = (event.data as { contentLength?: number }).contentLength || 0;
            downloadedSize = 0;
          } else if (event.event === "Progress") {
            downloadedSize += (event.data as { chunkLength: number }).chunkLength;
            if (totalSize > 0) {
              setUpdateState(prev => ({ ...prev, progress: (downloadedSize / totalSize) * 100 }));
            }
          } else if (event.event === "Finished") {
            setUpdateState(prev => ({ ...prev, progress: 100 }));
          }
        });

        await relaunch();
      }
    } catch {
      setUpdateState(prev => ({
        ...prev,
        downloading: false,
        error: "Failed to download update",
      }));
    }
  };

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  const handleReset = () => {
    setLocalSettings(defaultAppSettings);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm"
          >
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)]">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[var(--accent-purple)]/20">
                    <Settings className="w-5 h-5 text-[var(--accent-purple)]" />
                  </div>
                  <div>
                    <h2 className="font-semibold">Settings</h2>
                    <p className="text-xs text-[var(--text-secondary)]">Configure app behavior</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors text-[var(--text-secondary)]"
                >
                  ✕
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-5">
                {/* Max Display Rows */}
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">
                    Max Display Rows
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="10000"
                      value={localSettings.maxDisplayRows}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1;
                        setLocalSettings(prev => ({ ...prev, maxDisplayRows: Math.min(10000, Math.max(1, val)) }));
                      }}
                      className="flex-1 px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg text-sm focus:outline-none focus:border-[var(--accent-purple)] transition-colors"
                    />
                    <span className="text-xs text-[var(--text-secondary)]">rows</span>
                  </div>
                  <p className="text-[10px] text-[var(--text-secondary)] mt-1.5">
                    Maximum rows to display per table (1 - 10,000)
                  </p>
                </div>

                {/* Divider */}
                <div className="border-t border-[var(--border-color)]" />

                {/* Version & Updates */}
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">
                    Version
                  </label>
                  <div className="p-3 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)]">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono font-medium">v{VERSION}</span>
                        {updateState.checking ? (
                          <span className="flex items-center gap-1 text-[10px] text-[var(--text-secondary)]">
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            Checking...
                          </span>
                        ) : updateState.available ? (
                          <span className="flex items-center gap-1 text-[10px] text-[var(--accent-green)]">
                            <Download className="w-3 h-3" />
                            v{updateState.version} available
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] text-[var(--text-secondary)]">
                            <Check className="w-3 h-3" />
                            Up to date
                          </span>
                        )}
                      </div>
                      <button
                        onClick={checkForUpdates}
                        disabled={updateState.checking}
                        className="p-1 rounded hover:bg-[var(--bg-tertiary)] transition-colors disabled:opacity-50"
                        title="Check for updates"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 text-[var(--text-secondary)] ${updateState.checking ? 'animate-spin' : ''}`} />
                      </button>
                    </div>

                    {/* Update Progress */}
                    {updateState.downloading && (
                      <div className="mt-2">
                        <div className="h-1.5 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[var(--accent-green)] transition-all"
                            style={{ width: `${updateState.progress}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-[var(--text-secondary)] mt-1">
                          Downloading... {Math.round(updateState.progress)}%
                        </p>
                      </div>
                    )}

                    {/* Update Button */}
                    {updateState.available && !updateState.downloading && (
                      <button
                        onClick={handleUpdate}
                        className="mt-2 w-full px-3 py-1.5 text-xs font-medium rounded-md bg-[var(--accent-green)] text-white hover:bg-[var(--accent-green)]/90 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Update to v{updateState.version}
                      </button>
                    )}

                    {/* Error */}
                    {updateState.error && (
                      <p className="mt-2 text-[10px] text-[var(--accent-red)]">
                        {updateState.error}
                      </p>
                    )}
                  </div>

                  {/* GitHub Link */}
                  <a
                    href="https://github.com/monorka/tabletrace-oss/releases"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[10px] text-[var(--text-secondary)] hover:text-[var(--accent-purple)] mt-2 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    View all releases on GitHub
                  </a>
                </div>

              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--border-color)] bg-[var(--bg-primary)]/50">
                <button
                  onClick={handleReset}
                  className="px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded-md transition-colors"
                >
                  Reset to Default
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={onClose}
                    className="px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-1.5 text-xs font-medium bg-[var(--accent-purple)] hover:bg-[var(--accent-purple)]/80 rounded-md transition-colors"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

