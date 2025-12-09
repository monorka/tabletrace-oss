import { Loader2 } from "lucide-react";
import { ConnectionStatus } from "@/stores/connectionStore";
import { PgConfig } from "@/lib/tauri";
import { ConnectionTab } from "../types";
import { DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ConnectionDialogFooterProps {
  activeTab: ConnectionTab;
  config: PgConfig;
  testing: boolean;
  status: ConnectionStatus;
  onTestConnection: () => void;
  onClose: () => void;
}

export function ConnectionDialogFooter({
  activeTab,
  config,
  testing,
  status,
  onTestConnection,
  onClose,
}: ConnectionDialogFooterProps) {
  const isDisabled = status === "connecting" || !config.host || !config.database;

  return (
    <DialogFooter className="px-4 sm:px-6 py-4 border-t border-border bg-background/50 flex-col sm:flex-row gap-2 sm:justify-between">
      <Button
        type="button"
        onClick={onTestConnection}
        disabled={testing || status === "connecting" || !config.host || !config.database}
        variant="ghost"
        size="sm"
        className="text-muted-foreground hover:text-foreground w-full sm:w-auto"
      >
        {testing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="ml-2">Testing...</span>
          </>
        ) : (
          "Test Connection"
        )}
      </Button>

      <div className="flex items-center gap-2 w-full sm:w-auto">
        <Button
          type="button"
          onClick={onClose}
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground flex-1 sm:flex-initial"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          form="connection-form"
          disabled={isDisabled}
          size="sm"
          className={cn(
            "text-white flex-1 sm:flex-initial",
            activeTab === "postgres" 
              ? "bg-accent-purple hover:bg-accent-purple/90" 
              : "bg-accent-green hover:bg-accent-green/90",
            isDisabled ? "opacity-50" : ""
          )}
        >
          {status === "connecting" ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="ml-2">Connecting...</span>
            </>
          ) : (
            "Connect"
          )}
        </Button>
      </div>
    </DialogFooter>
  );
}

