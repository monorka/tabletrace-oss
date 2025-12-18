import { Database, Zap } from "lucide-react";
import { ConnectionTab } from "../types";
import { cn } from "@/lib/utils";

interface ConnectionTabsProps {
  activeTab: ConnectionTab;
  onTabChange: (tab: ConnectionTab) => void;
}

export function ConnectionTabs({ activeTab, onTabChange }: ConnectionTabsProps) {
  return (
    <div className="flex border-b border-border">
      <button
        onClick={() => onTabChange("postgres")}
        className={cn(
          "flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2",
          activeTab === "postgres"
            ? "text-accent-purple border-b-2 border-accent-purple bg-accent-purple/5"
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        )}
      >
        <Database className="w-4 h-4" />
        <span className="hidden sm:inline">PostgreSQL</span>
        <span className="sm:hidden">PG</span>
      </button>
      <button
        onClick={() => onTabChange("supabase")}
        className={cn(
          "flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2",
          activeTab === "supabase"
            ? "text-accent-green border-b-2 border-accent-green bg-accent-green/5"
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        )}
      >
        <Zap className="w-4 h-4" />
        <span className="hidden sm:inline">Supabase</span>
        <span className="sm:hidden">SB</span>
      </button>
    </div>
  );
}

