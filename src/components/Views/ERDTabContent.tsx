/**
 * ERD Tab Content Component
 */

import { useState } from "react";
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
  const [erdHoveredTable, setErdHoveredTable] = useState<ERDHoveredTable | null>(null);

  const handleHoveredTableChange = (table: ERDHoveredTable | null) => {
    setErdHoveredTable(table);
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

