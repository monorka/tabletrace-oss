/**
 * ERD Tab Content Component
 */

import { ERDView } from "../ERD";
import { TableInfo, ForeignKeyInfo } from "../../lib/tauri";
import { ERDHoveredTable } from "../../types";

export interface ERDTabContentProps {
  tables: TableInfo[];
  foreignKeys: ForeignKeyInfo[];
  watchedTables: string[];
  onHoveredTableChange?: (table: ERDHoveredTable | null) => void;
}

export function ERDTabContent({
  tables,
  foreignKeys,
  watchedTables,
  onHoveredTableChange
}: ERDTabContentProps) {
  const handleHoveredTableChange = (table: ERDHoveredTable | null) => {
    onHoveredTableChange?.(table);
  };

  return (
    <ERDView
      tables={tables}
      foreignKeys={foreignKeys}
      watchedTables={watchedTables}
      onHoveredTableChange={handleHoveredTableChange}
    />
  );
}

