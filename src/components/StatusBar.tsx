import { Database, Activity, Eye } from "lucide-react";

interface StatusBarProps {
  eventCount: number;
  watchedTableCount: number;
  totalTableCount: number;
}

export function StatusBar({
  eventCount,
  watchedTableCount,
  totalTableCount,
}: StatusBarProps) {
  return (
    <footer className="h-6 border-t border-[var(--border-color)] bg-[var(--bg-secondary)] flex items-center px-3 text-[10px] text-[var(--text-secondary)] gap-4 no-select">
      <div className="flex items-center gap-1.5">
        <Activity className="w-3 h-3" />
        <span>{eventCount} events</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Eye className="w-3 h-3" />
        <span>{watchedTableCount} tables watched</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Database className="w-3 h-3" />
        <span>{totalTableCount} tables available</span>
      </div>
      <div className="flex-1" />
      <span className="text-[var(--accent-green)]">● Polling Mode</span>
    </footer>
  );
}

