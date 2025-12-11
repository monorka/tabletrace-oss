/**
 * Settings Dialog Component
 */

import { useState } from "react";
import { Settings } from "lucide-react";
import { SettingsDialogProps, AppSettings, defaultAppSettings } from "../../types";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { MaxDisplayRowsSection } from "./MaxDisplayRowsSection";
import { VersionSection } from "./VersionSection";
import { ThemeSection } from "./ThemeSection";
import { UpdateState } from "./types";
import { applyTheme } from "../../utils/theme";

export function SettingsDialog({
  isOpen,
  onClose,
  settings,
  onSave,
}: SettingsDialogProps) {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [updateState, setUpdateState] = useState<UpdateState>({
    checking: false,
    available: false,
    downloading: false,
    progress: 0,
  });

  const checkForUpdates = async () => {
    setUpdateState((prev) => ({ ...prev, checking: true, error: undefined }));
    try {
      const update = await check();
      if (update) {
        setUpdateState((prev) => ({
          ...prev,
          checking: false,
          available: true,
          version: update.version,
        }));
      } else {
        setUpdateState((prev) => ({
          ...prev,
          checking: false,
          available: false,
        }));
      }
    } catch {
      setUpdateState((prev) => ({
        ...prev,
        checking: false,
        error: "Failed to check for updates",
      }));
    }
  };

  const handleUpdate = async () => {
    setUpdateState((prev) => ({ ...prev, downloading: true, progress: 0 }));
    try {
      const update = await check();
      if (update) {
        let totalSize = 0;
        let downloadedSize = 0;

        await update.downloadAndInstall((event) => {
          if (event.event === "Started") {
            totalSize =
              (event.data as { contentLength?: number }).contentLength || 0;
            downloadedSize = 0;
          } else if (event.event === "Progress") {
            downloadedSize += (event.data as { chunkLength: number })
              .chunkLength;
            if (totalSize > 0) {
              setUpdateState((prev) => ({
                ...prev,
                progress: (downloadedSize / totalSize) * 100,
              }));
            }
          } else if (event.event === "Finished") {
            setUpdateState((prev) => ({ ...prev, progress: 100 }));
          }
        });

        await relaunch();
      }
    } catch {
      setUpdateState((prev) => ({
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

  const handleMaxDisplayRowsChange = (value: number) => {
    setLocalSettings((prev) => ({ ...prev, maxDisplayRows: value }));
  };

  const handleThemeChange = (theme: AppSettings["theme"]) => {
    setLocalSettings((prev) => ({ ...prev, theme }));
    // Apply theme immediately for preview
    applyTheme(theme);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader className="px-6 pt-6 pb-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent-purple/20">
              <Settings className="w-5 h-5 text-accent-purple" />
            </div>
            <div>
              <DialogTitle>Settings</DialogTitle>
              <DialogDescription>Configure app behavior</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-5">
          {/* Theme Selection */}
          <ThemeSection
            theme={localSettings.theme}
            onChange={handleThemeChange}
          />

          {/* Divider */}
          <div className="border-t border-border" />

          {/* Max Display Rows */}
          <MaxDisplayRowsSection
            maxDisplayRows={localSettings.maxDisplayRows}
            onChange={handleMaxDisplayRowsChange}
          />

          {/* Divider */}
          <div className="border-t border-border" />

          {/* Version & Updates */}
          <VersionSection
            updateState={updateState}
            onCheckForUpdates={checkForUpdates}
            onUpdate={handleUpdate}
          />
        </div>

        <DialogFooter className="border-t border-border bg-card/50 px-6 py-4">
          <Button
            onClick={handleReset}
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
          >
            Reset to Default
          </Button>
          <div className="flex items-center gap-2">
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              size="sm"
              className="bg-accent-purple hover:bg-accent-purple/80 text-white"
            >
              Save
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

