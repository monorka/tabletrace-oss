/**
 * Dry Run Tables Grid Component
 */

import { DryRunTablesGridProps } from "../../types";
import { DryRunTableCard } from "./DryRunTableCard";

export function DryRunTablesGrid({ watchedTables, getWatchedTableData, getDryRunChangesForTable }: DryRunTablesGridProps) {
  const gridCols = watchedTables.length === 1 ? 1 : watchedTables.length === 2 ? 2 : watchedTables.length <= 4 ? 2 : 3;

  return (
    <div
      className="h-full p-4 grid gap-4 overflow-auto"
      style={{
        gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
        gridAutoRows: watchedTables.length <= 2 ? '1fr' : 'minmax(300px, 1fr)'
      }}
    >
      {watchedTables.map((fullName) => {
        const [schema, table] = fullName.split(".");
        const data = getWatchedTableData(fullName);
        const dryRunChanges = getDryRunChangesForTable(schema, table);

        return (
          <DryRunTableCard
            key={fullName}
            schema={schema}
            table={table}
            data={data}
            dryRunChanges={dryRunChanges}
          />
        );
      })}
    </div>
  );
}




