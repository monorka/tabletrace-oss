/**
 * Legend component for WatchedTableCard
 */

export function WatchedTableCardLegend() {
  return (
    <div className="px-3 py-1.5 border-t border-border flex items-center gap-3 text-[10px] text-muted-foreground">
      <span className="flex items-center gap-1">
        <span className="w-2 h-2 rounded-sm bg-accent-green"></span> INSERT
      </span>
      <span className="flex items-center gap-1">
        <span className="w-2 h-2 rounded-sm bg-accent-yellow"></span> UPDATE
      </span>
      <span className="flex items-center gap-1">
        <span className="w-2 h-2 rounded-sm bg-accent-red"></span> DELETE
      </span>
    </div>
  );
}

