/**
 * Settings Dialog Component
 */

import { useState, useEffect } from "react";
import { Settings, Download, Check, RefreshCw, ExternalLink } from "lucide-react";
import { SettingsDialogProps, AppSettings, defaultAppSettings } from "../../types";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { VERSION } from "../../index";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";

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
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader className="px-6 pt-6 pb-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[var(--accent-purple)]/20">
              <Settings className="w-5 h-5 text-[var(--accent-purple)]" />
            </div>
            <div>
              <DialogTitle>Settings</DialogTitle>
              <DialogDescription>Configure app behavior</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-5">
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
                      <Button
                        onClick={checkForUpdates}
                        disabled={updateState.checking}
                        variant="ghost"
                        size="icon-sm"
                        className="h-auto w-auto p-1"
                        title="Check for updates"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 text-[var(--text-secondary)] ${updateState.checking ? 'animate-spin' : ''}`} />
                      </Button>
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
                      <Button
                        onClick={handleUpdate}
                        className="mt-2 w-full bg-[var(--accent-green)] hover:bg-[var(--accent-green)]/90 text-white"
                        size="sm"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Update to v{updateState.version}
                      </Button>
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

        <DialogFooter className="border-t border-[var(--border-color)] bg-[var(--bg-primary)]/50 px-6 py-4">
          <Button
            onClick={handleReset}
            variant="ghost"
            size="sm"
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            Reset to Default
          </Button>
          <div className="flex items-center gap-2">
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              size="sm"
              className="bg-[var(--accent-purple)] hover:bg-[var(--accent-purple)]/80 text-white"
            >
              Save
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

