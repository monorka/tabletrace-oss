import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, RefreshCw } from "lucide-react";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

interface UpdateInfo {
  version: string;
  body?: string;
}

export function UpdateChecker() {
  const [updateAvailable, setUpdateAvailable] = useState<UpdateInfo | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isInstalling, setIsInstalling] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Skip update check in development mode
    if (import.meta.env.DEV) return;
    checkForUpdates();
  }, []);

  const checkForUpdates = async () => {
    try {
      const update = await check();
      if (update) {
        setUpdateAvailable({
          version: update.version,
          body: update.body,
        });
      }
    } catch (error) {
      console.error("Failed to check for updates:", error);
    }
  };

  const handleDownloadAndInstall = async () => {
    if (!updateAvailable) return;

    try {
      setIsDownloading(true);
      const update = await check();

      if (update) {
        let totalSize = 0;
        let downloadedSize = 0;

        await update.downloadAndInstall((event) => {
          if (event.event === "Started") {
            totalSize = (event.data as { contentLength?: number }).contentLength || 0;
            downloadedSize = 0;
            setDownloadProgress(0);
          } else if (event.event === "Progress") {
            downloadedSize += (event.data as { chunkLength: number }).chunkLength;
            if (totalSize > 0) {
              setDownloadProgress((downloadedSize / totalSize) * 100);
            }
          } else if (event.event === "Finished") {
            setDownloadProgress(100);
            setIsDownloading(false);
            setIsInstalling(true);
          }
        });

        // Relaunch the app
        await relaunch();
      }
    } catch (error) {
      console.error("Failed to download and install update:", error);
      setIsDownloading(false);
    }
  };

  if (dismissed || !updateAvailable) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-4 right-4 z-50 max-w-sm"
      >
        <div className="bg-[var(--bg-secondary)] border border-[var(--accent-green)]/30 rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-[var(--accent-green)]/10 border-b border-[var(--accent-green)]/20">
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4 text-[var(--accent-green)]" />
              <span className="text-sm font-medium text-[var(--accent-green)]">
                Update Available
              </span>
            </div>
            <button
              onClick={() => setDismissed(true)}
              className="p-1 rounded hover:bg-[var(--bg-tertiary)] transition-colors"
            >
              <X className="w-4 h-4 text-[var(--text-secondary)]" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4">
            <p className="text-sm text-[var(--text-primary)] mb-1">
              Version <span className="font-mono font-medium">{updateAvailable.version}</span> is available
            </p>
            {updateAvailable.body && (
              <p className="text-xs text-[var(--text-secondary)] mb-3 line-clamp-2">
                {updateAvailable.body}
              </p>
            )}

            {/* Progress bar */}
            {isDownloading && (
              <div className="mb-3">
                <div className="h-1.5 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-[var(--accent-green)]"
                    initial={{ width: 0 }}
                    animate={{ width: `${downloadProgress}%` }}
                  />
                </div>
                <p className="text-[10px] text-[var(--text-secondary)] mt-1">
                  Downloading... {Math.round(downloadProgress)}%
                </p>
              </div>
            )}

            {isInstalling && (
              <div className="flex items-center gap-2 text-xs text-[var(--accent-green)] mb-3">
                <RefreshCw className="w-3 h-3 animate-spin" />
                Installing and restarting...
              </div>
            )}

            {/* Actions */}
            {!isDownloading && !isInstalling && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadAndInstall}
                  className="flex-1 px-3 py-1.5 text-xs font-medium rounded-md bg-[var(--accent-green)] text-white hover:bg-[var(--accent-green)]/90 transition-colors"
                >
                  Update Now
                </button>
                <button
                  onClick={() => setDismissed(true)}
                  className="px-3 py-1.5 text-xs font-medium rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                >
                  Later
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

