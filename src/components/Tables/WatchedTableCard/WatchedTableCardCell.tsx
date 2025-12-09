/**
 * Cell component for WatchedTableCard table
 */

import { TableCell } from "@/components/ui/table";
import { formatCellValue } from "@/utils/formatters";
import { cn } from "@/lib/utils";

interface WatchedTableCardCellProps {
  value: unknown;
  isChanged: boolean;
  isDeleted: boolean;
  isCopied: boolean;
  width: number;
  onClick: () => void;
}

export function WatchedTableCardCell({
  value,
  isChanged,
  isDeleted,
  isCopied,
  width,
  onClick
}: WatchedTableCardCellProps) {
  return (
    <TableCell
      className={cn(
        "px-3 py-1.5 border-b border-r border-border/30 cursor-pointer group/cell",
        isChanged && !isDeleted && "bg-accent-yellow/30 text-accent-yellow",
        isCopied && "bg-accent-green/20"
      )}
      style={{ width, minWidth: 60, maxWidth: width }}
      onClick={onClick}
      title="Click to copy"
    >
      <div className={cn("truncate", isDeleted && "line-through")}>
        {isCopied ? (
          <span className="text-accent-green text-[10px]">Copied!</span>
        ) : (
          formatCellValue(value)
        )}
      </div>
    </TableCell>
  );
}

