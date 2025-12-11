/**
 * Schema Grouped Tables Component
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Eye } from "lucide-react";
import { SchemaGroupedTablesProps } from "../../types";
import { TableListItem } from "./TableListItem";

export function SchemaGroupedTables({
  tables,
  watchedTables,
  selectedTable,
  tablesWithChanges,
  getChangesForTable,
  onSelectTable,
  onStopAllWatch,
  onStartWatch,
  onStopWatch,
}: SchemaGroupedTablesProps) {
  // Group tables by schema
  const groupedTables = tables.reduce((acc, table) => {
    if (!acc[table.schema]) {
      acc[table.schema] = [];
    }
    acc[table.schema].push(table);
    return acc;
  }, {} as Record<string, typeof tables>);

  // Sort schemas: public first, then alphabetically
  const sortedSchemas = Object.keys(groupedTables).sort((a, b) => {
    if (a === "public") return -1;
    if (b === "public") return 1;
    return a.localeCompare(b);
  });

  // Track expanded schemas (public is expanded by default)
  const [expandedSchemas, setExpandedSchemas] = useState<Set<string>>(new Set(["public"]));

  const toggleSchema = (schema: string) => {
    setExpandedSchemas((prev) => {
      const next = new Set(prev);
      if (next.has(schema)) {
        next.delete(schema);
      } else {
        next.add(schema);
      }
      return next;
    });
  };

  return (
    <div className="space-y-1">
      {sortedSchemas.map((schema) => {
        const schemaTables = groupedTables[schema];
        const isExpanded = expandedSchemas.has(schema);
        const watchedCount = schemaTables.filter((t) =>
          watchedTables.includes(`${schema}.${t.name}`)
        ).length;

        return (
          <div key={schema}>
            {/* Schema Header */}
            <div
              onClick={() => toggleSchema(schema)}
              className="w-full flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-secondary transition-colors cursor-pointer"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && toggleSchema(schema)}
            >
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ rotate: isExpanded ? 90 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronRight className="w-3 h-3 text-muted-foreground" />
                </motion.div>
                <span className={`text-xs font-medium ${schema === "public" ? "text-accent-purple" : "text-muted-foreground"}`}>
                  {schema}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  ({schemaTables.length})
                </span>
              </div>
              {watchedCount > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onStopAllWatch();
                  }}
                  className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-accent-green/20 text-accent-green hover:bg-accent-red/20 hover:text-accent-red transition-colors"
                  title="Stop all watches"
                >
                  {watchedCount} watching
                  <Eye className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Tables in this schema */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden p-2 space-y-1"
                >
                  {schemaTables.map((table) => {
                    const fullName = `${table.schema}.${table.name}`;
                    const isWatched = watchedTables.includes(fullName);
                    const isSelected = selectedTable?.schema === table.schema && selectedTable?.table === table.name;
                    const recentChanges = getChangesForTable(table.schema, table.name);
                    const statsChange = tablesWithChanges.find(c => c.schema === table.schema && c.table === table.name);

                    return (
                      <TableListItem
                        key={fullName}
                        schema={table.schema}
                        name={table.name}
                        columnCount={table.column_count}
                        isWatched={isWatched}
                        isSelected={isSelected}
                        changes={recentChanges.length}
                        statsChange={statsChange}
                        onSelect={() => onSelectTable(table.schema, table.name)}
                        onToggleWatch={async () => {
                          if (isWatched) {
                            await onStopWatch(table.schema, table.name);
                          } else {
                            await onStartWatch(table.schema, table.name);
                          }
                        }}
                      />
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}




