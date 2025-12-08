import { Zap } from "lucide-react";

export function AppTitle() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <Zap className="w-5 h-5 text-[var(--accent-purple)]" />
        <span className="font-semibold text-sm tracking-wide">TableTrace</span>
      </div>
      <span className="text-xs text-[var(--text-secondary)]">v0.1.0</span>
    </div>
  );
}

