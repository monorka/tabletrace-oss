/**
 * Max Display Rows Section Component
 */

import { Input } from "../ui/input";
import { Label } from "../ui/label";

interface MaxDisplayRowsSectionProps {
  maxDisplayRows: number;
  onChange: (value: number) => void;
}

export function MaxDisplayRowsSection({
  maxDisplayRows,
  onChange,
}: MaxDisplayRowsSectionProps) {
  return (
    <div>
      <Label className="block text-xs font-medium text-muted-foreground mb-2">
        Max Display Rows
      </Label>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          min="1"
          max="10000"
          value={maxDisplayRows}
          onChange={(e) => {
            const val = parseInt(e.target.value) || 1;
            onChange(Math.min(10000, Math.max(1, val)));
          }}
          className="flex-1"
        />
        <span className="text-xs text-muted-foreground">rows</span>
      </div>
      <p className="text-[10px] text-muted-foreground mt-1.5">
        Maximum rows to display per table (1 - 10,000)
      </p>
    </div>
  );
}

