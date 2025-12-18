/**
 * Filter component for WatchedTableCard
 */

import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface WatchedTableCardFilterProps {
  filterText: string;
  onFilterTextChange: (text: string) => void;
}

export function WatchedTableCardFilter({
  filterText,
  onFilterTextChange
}: WatchedTableCardFilterProps) {
  return (
    <div className="px-4 py-2 border-b border-border bg-background">
      <div className="flex items-center gap-2">
        <Input
          type="text"
          value={filterText}
          onChange={(e) => onFilterTextChange(e.target.value)}
          placeholder="col=val, col!=val, col>10, col~text"
          className="flex-1 text-xs h-auto py-1.5 focus-visible:border-accent-purple"
        />
        {filterText && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onFilterTextChange("")}
            className="h-auto w-auto p-1"
            title="Clear filter"
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
      <div className="text-[10px] text-muted-foreground mt-1">
        Examples: <code className="bg-muted px-1 rounded">status=1</code>, <code className="bg-muted px-1 rounded">name~john</code>, <code className="bg-muted px-1 rounded">age&gt;=18,active=true</code>
      </div>
    </div>
  );
}

