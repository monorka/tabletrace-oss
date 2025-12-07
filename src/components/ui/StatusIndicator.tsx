/**
 * Status indicator dot component
 */

interface StatusIndicatorProps {
  status: string;
}

export function StatusIndicator({ status }: StatusIndicatorProps) {
  const colors: Record<string, string> = {
    disconnected: "bg-[var(--text-secondary)]",
    connecting: "bg-yellow-500 animate-pulse",
    connected: "bg-[var(--accent-green)]",
    reconnecting: "bg-yellow-500 animate-pulse",
    error: "bg-[var(--accent-red)]",
  };

  return (
    <div className={`w-2 h-2 rounded-full ${colors[status] || colors.disconnected}`} />
  );
}




