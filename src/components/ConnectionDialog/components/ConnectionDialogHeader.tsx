import { Database, Zap } from "lucide-react";
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ConnectionTab } from "../types";
import { cn } from "@/lib/utils";

interface ConnectionDialogHeaderProps {
  activeTab: ConnectionTab;
}

export function ConnectionDialogHeader({ activeTab }: ConnectionDialogHeaderProps) {
  return (
    <DialogHeader className="px-6 py-4 border-b border-border">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "p-2 rounded-lg transition-colors",
              activeTab === "postgres" 
                ? "bg-accent-purple/20" 
                : "bg-accent-green/20"
            )}
          >
            {activeTab === "postgres" ? (
              <Database className={cn("w-5 h-5", "text-accent-purple")} />
            ) : (
              <Zap className={cn("w-5 h-5", "text-accent-green")} />
            )}
          </div>
          <div>
            <DialogTitle className="text-left">Connect to Database</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {activeTab === "postgres" ? "PostgreSQL" : "Supabase Local"}
            </DialogDescription>
          </div>
        </div>
      </div>
    </DialogHeader>
  );
}

