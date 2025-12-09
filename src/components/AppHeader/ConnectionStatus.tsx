import { Badge } from "../ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { ConnectionStatus as ConnectionStatusType } from "../../stores/connectionStore";
import { cn } from "../../lib/utils";

interface ConnectionStatusProps {
  status: ConnectionStatusType;
  config?: { user: string; host: string; port: number; database: string };
}

export function ConnectionStatus({ status, config }: ConnectionStatusProps) {
  const connectionInfo = config
    ? `${config.user}@${config.host}:${config.port}/${config.database}`
    : "";

  const getStatusLabel = () => {
    switch (status) {
      case "disconnected":
        return "Not Connected";
      case "connecting":
        return "Connecting...";
      case "connected":
        return (
          <span className="flex items-center gap-1">
            <span className="font-medium">{config?.database}</span>
            <span className="opacity-60">@</span>
            <span>{config?.host}:{config?.port}</span>
          </span>
        );
      case "error":
        return "Connection Error";
      default:
        return "Unknown";
    }
  };

  const getStatusVariant = (): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "connected":
        return "default";
      case "connecting":
        return "outline";
      case "error":
        return "destructive";
      case "disconnected":
      default:
        return "secondary";
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "connected":
        return "bg-accent-green/20 text-accent-green border-accent-green";
      case "connecting":
        return "bg-accent-yellow/20 text-accent-yellow border-accent-yellow";
      default:
        return "";
    }
  };

  const content = (
    <div className="flex items-center gap-2">
      <Badge
        variant={getStatusVariant()}
        className={cn(
          "text-xs px-2 py-0.5",
          getStatusColor()
        )}
      >
        {getStatusLabel()}
      </Badge>
    </div>
  );

  if (status === "connected" && connectionInfo) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {content}
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-1">
            <div className="text-[10px] text-muted-foreground">Connection</div>
            <div className="text-xs font-mono">{connectionInfo}</div>
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
}

