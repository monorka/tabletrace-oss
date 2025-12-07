/**
 * Watched Tables Grid Component
 */

import { WatchedTablesGridProps } from "../../types";
import { WatchedTableCard } from "./WatchedTableCard";

export function WatchedTablesGrid({ watchedTables, getWatchedTableData, onSelectTable }: WatchedTablesGridProps) {
  const gridCols = watchedTables.length === 1 ? 1 : watchedTables.length === 2 ? 2 : watchedTables.length <= 4 ? 2 : 3;

  return (
    <div
      className="h-full p-4 grid gap-4"
      style={{
        gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
        gridAutoRows: watchedTables.length <= 2 ? '1fr' : 'minmax(300px, 1fr)'
      }}
    >
      {watchedTables.map((fullName) => {
        const [schema, table] = fullName.split(".");
        const data = getWatchedTableData(fullName);

        return (
          <WatchedTableCard
            key={fullName}
            schema={schema}
            table={table}
            data={data}
            onSelect={() => onSelectTable(schema, table)}
          />
        );
      })}
    </div>
  );
}




