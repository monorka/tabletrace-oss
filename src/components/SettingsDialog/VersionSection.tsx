/**
 * Version & Updates Section Component
 */

import { Download, Check, RefreshCw, ExternalLink } from "lucide-react";
import { VERSION } from "../../index";
import { Button } from "../ui/button";
import { UpdateState } from "./types";

interface VersionSectionProps {
  updateState: UpdateState;
  onCheckForUpdates: () => void;
  onUpdate: () => void;
}

export function VersionSection({
  updateState,
  onCheckForUpdates,
  onUpdate,
}: VersionSectionProps) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-2">
        Version
      </label>
      <div className="p-3 rounded-lg bg-card border border-border space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono font-medium">v{VERSION}</span>
            {updateState.checking ? (
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <RefreshCw className="w-3 h-3 animate-spin" />
                Checking...
              </span>
            ) : updateState.available ? (
              <span className="flex items-center gap-1 text-[10px] text-accent-green">
                <Download className="w-3 h-3" />
                v{updateState.version} available
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Check className="w-3 h-3" />
                Up to date
              </span>
            )}
          </div>
          <Button
            onClick={onCheckForUpdates}
            disabled={updateState.checking}
            variant="ghost"
            size="icon-sm"
            className="h-auto w-auto p-1"
            title="Check for updates"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-muted-foreground ${
                updateState.checking ? "animate-spin" : ""
              }`}
            />
          </Button>
        </div>

        {/* Update Progress */}
        {updateState.downloading && (
          <div className="mt-2">
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-accent-green transition-all"
                style={{ width: `${updateState.progress}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Downloading... {Math.round(updateState.progress)}%
            </p>
          </div>
        )}

        {/* Update Button */}
        {updateState.available && !updateState.downloading && (
          <Button
            onClick={onUpdate}
            className="mt-2 w-full bg-accent-green hover:bg-accent-green/90 text-white"
            size="sm"
          >
            <Download className="w-3.5 h-3.5" />
            Update to v{updateState.version}
          </Button>
        )}

        {/* Error */}
        {updateState.error && (
          <p className="mt-2 text-[10px] text-destructive">
            {updateState.error}
          </p>
        )}
      </div>

      {/* GitHub Link */}
      <a
        href="https://github.com/monorka/tabletrace-oss/releases"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-accent-purple mt-2 transition-colors"
      >
        <ExternalLink className="w-3 h-3" />
        View all releases on GitHub
      </a>
    </div>
  );
}

