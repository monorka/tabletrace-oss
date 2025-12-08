import { StatusIndicator } from "../ui";
import { ConnectionStatus as ConnectionStatusType } from "../../stores/connectionStore";

interface ConnectionStatusProps {
  status: ConnectionStatusType;
  config?: { user: string; host: string; port: number; database: string };
}

export function ConnectionStatus({ status, config }: ConnectionStatusProps) {
  const connectionInfo = config
    ? `${config.user}@${config.host}:${config.port}/${config.database}`
    : "";

  return (
    <div className="flex items-center gap-2 group relative">
      <StatusIndicator status={status} />
      <span className="text-xs text-[var(--text-secondary)]">
        {status === "disconnected" && "Not Connected"}
        {status === "connecting" && "Connecting..."}
        {status === "connected" && (
          <span className="flex items-center gap-1">
            <span className="font-medium text-[var(--text-primary)]">{config?.database}</span>
            <span className="opacity-60">@</span>
            <span>{config?.host}:{config?.port}</span>
          </span>
        )}
        {status === "error" && "Connection Error"}
      </span>
      {/* Tooltip with full connection info */}
      {status === "connected" && connectionInfo && (
        <div className="absolute top-full right-0 mt-2 px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap">
          <div className="text-[10px] text-[var(--text-secondary)] mb-1">Connection</div>
          <div className="text-xs font-mono">{connectionInfo}</div>
        </div>
      )}
    </div>
  );
}

