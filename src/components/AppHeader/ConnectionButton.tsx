import { LogOut } from "lucide-react";
import { ConnectionStatus as ConnectionStatusType } from "../../stores/connectionStore";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";

interface ConnectionButtonProps {
  status: ConnectionStatusType;
  onConnect: () => void;
  onDisconnect: () => void;
}

export function ConnectionButton({
  status,
  onConnect,
  onDisconnect,
}: ConnectionButtonProps) {
  if (status === "disconnected" || status === "error") {
    return (
      <Button
        onClick={onConnect}
        size="sm"
        className={cn(
          "text-xs",
          "bg-[var(--accent-purple)] hover:bg-[var(--accent-purple)]/80",
          "text-white"
        )}
      >
        Connect
      </Button>
    );
  }

  if (status === "connected") {
    return (
      <Button
        onClick={onDisconnect}
        variant="ghost"
        size="sm"
        className={cn(
          "text-xs",
          "text-[var(--text-secondary)]",
          "hover:text-[var(--accent-red)] hover:bg-[var(--accent-red)]/10"
        )}
      >
        <LogOut className="w-3 h-3" />
        Disconnect
      </Button>
    );
  }

  return null;
}

