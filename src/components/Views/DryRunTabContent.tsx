/**
 * Dry Run Tab Content - SQL editor on top, table data with results on bottom
 */

import { motion, AnimatePresence } from "framer-motion";
import {
  Play, Loader2, ChevronDown, ChevronRight,
  Plus, Pencil, Trash2, Table2, Link2, AlertCircle
} from "lucide-react";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { cn } from "../../lib/utils";
import { DryRunResult, DryRunChange, ColumnInfo, ForeignKeyInfo, getColumns, getRows } from "../../lib/tauri";
import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";

export interface DryRunTabContentProps {
  sql: string;
  setSql: (sql: string) => void;
  isRunning: boolean;
  result: DryRunResult | null;
  onRun: () => void;
  targetTable: string | null;
  foreignKeys: ForeignKeyInfo[];
}

type QueryType = "INSERT" | "UPDATE" | "DELETE";

// Local state for dry run table data (independent from watch)
interface TableDataState {
  columns: ColumnInfo[];
  rows: Record<string, unknown>[];
  loading: boolean;
  error: string | null;
}

// Check if a row matches a change (by comparing PK or all values)
const rowMatchesChange = (
  row: Record<string, unknown>,
  change: DryRunChange,
  columns: ColumnInfo[]
): { matches: boolean; changeType: "INSERT" | "UPDATE" | "DELETE" | null } => {
  const pkColumn = columns.find(c => c.is_primary_key);
  const data = change.type === "DELETE" ? change.before : change.after;

  if (!data) return { matches: false, changeType: null };

  if (pkColumn) {
    const rowPk = row[pkColumn.name];
    const changePk = data[pkColumn.name];
    if (rowPk !== undefined && changePk !== undefined && String(rowPk) === String(changePk)) {
      return { matches: true, changeType: change.type };
    }
  }

  return { matches: false, changeType: null };
};

export function DryRunTabContent({
  sql,
  setSql,
  isRunning,
  result,
  onRun,
  targetTable,
  foreignKeys
}: DryRunTabContentProps) {
  // Main table data
  const [mainTableData, setMainTableData] = useState<TableDataState>({
    columns: [],
    rows: [],
    loading: false,
    error: null
  });

  // Related tables data (keyed by full table name)
  const [relatedTablesData, setRelatedTablesData] = useState<Record<string, TableDataState>>({});

  // Accordion state for related tables
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());

  // Resizable bottom panel (vertical)
  const [bottomHeight, setBottomHeight] = useState(400);
  const isResizingVertical = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Resizable left panel (horizontal)
  const [leftPanelWidth, setLeftPanelWidth] = useState(200);
  const isResizingHorizontal = useRef(false);

  const handleVerticalResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizingVertical.current = true;

    const startY = e.clientY;
    const startHeight = bottomHeight;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isResizingVertical.current) return;
      const deltaY = startY - moveEvent.clientY;
      const newHeight = Math.max(100, Math.min(600, startHeight + deltaY));
      setBottomHeight(newHeight);
    };

    const handleMouseUp = () => {
      isResizingVertical.current = false;
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }, [bottomHeight]);

  const handleHorizontalResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizingHorizontal.current = true;

    const startX = e.clientX;
    const startWidth = leftPanelWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isResizingHorizontal.current) return;
      const deltaX = moveEvent.clientX - startX;
      const newWidth = Math.max(120, Math.min(400, startWidth + deltaX));
      setLeftPanelWidth(newWidth);
    };

    const handleMouseUp = () => {
      isResizingHorizontal.current = false;
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }, [leftPanelWidth]);

  // Find related tables from foreign keys
  const relatedTables = useMemo(() => {
    if (!targetTable) return [];
    const [schema, table] = targetTable.includes(".")
      ? targetTable.split(".")
      : ["public", targetTable];

    const related = new Set<string>();

    // Tables that reference this table (incoming FK)
    foreignKeys
      .filter(fk => fk.to_schema === schema && fk.to_table === table)
      .forEach(fk => related.add(`${fk.from_schema}.${fk.from_table}`));

    // Tables this table references (outgoing FK)
    foreignKeys
      .filter(fk => fk.from_schema === schema && fk.from_table === table)
      .forEach(fk => related.add(`${fk.to_schema}.${fk.to_table}`));

    return Array.from(related).filter(t => t !== targetTable);
  }, [targetTable, foreignKeys]);

  // Fetch main table data
  useEffect(() => {
    if (!targetTable) {
      setMainTableData({ columns: [], rows: [], loading: false, error: null });
      return;
    }

    const [schema, table] = targetTable.includes(".")
      ? targetTable.split(".")
      : ["public", targetTable];

    const fetchData = async () => {
      setMainTableData(prev => ({ ...prev, loading: true, error: null }));
      try {
        const [cols, rowsData] = await Promise.all([
          getColumns(schema, table),
          getRows(schema, table, 100)
        ]);
        setMainTableData({
          columns: cols,
          rows: rowsData,
          loading: false,
          error: null
        });
      } catch (err) {
        setMainTableData({
          columns: [],
          rows: [],
          loading: false,
          error: String(err)
        });
      }
    };

    fetchData();
  }, [targetTable]);

  // Fetch related tables data
  useEffect(() => {
    if (relatedTables.length === 0) {
      setRelatedTablesData({});
      return;
    }

    const fetchRelatedData = async () => {
      const newData: Record<string, TableDataState> = {};

      for (const fullName of relatedTables) {
        newData[fullName] = { columns: [], rows: [], loading: true, error: null };
      }
      setRelatedTablesData(newData);

      for (const fullName of relatedTables) {
        const [schema, table] = fullName.split(".");
        try {
          const [cols, rowsData] = await Promise.all([
            getColumns(schema, table),
            getRows(schema, table, 50)
          ]);
          setRelatedTablesData(prev => ({
            ...prev,
            [fullName]: { columns: cols, rows: rowsData, loading: false, error: null }
          }));
        } catch (err) {
          setRelatedTablesData(prev => ({
            ...prev,
            [fullName]: { columns: [], rows: [], loading: false, error: String(err) }
          }));
        }
      }
    };

    fetchRelatedData();
  }, [relatedTables]);

  const columns = mainTableData.columns;
  const rows = mainTableData.rows;

  // Get sample value from existing data
  const getExistingValue = (colName: string): string | null => {
    if (rows.length === 0) return null;
    const value = rows[0][colName];
    if (value === null || value === undefined) return null;
    if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
    if (typeof value === 'number') return String(value);
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    if (typeof value === 'object') return `'${JSON.stringify(value)}'::jsonb`;
    return null;
  };

  // Get first row's PK value for UPDATE/DELETE
  const getFirstRowPkValue = (): string | null => {
    if (rows.length === 0) return null;
    const pkColumn = columns.find(c => c.is_primary_key);
    if (!pkColumn) return null;
    const pkValue = rows[0][pkColumn.name];
    if (pkValue === null || pkValue === undefined) return null;
    const type = pkColumn.data_type.toLowerCase();
    if (type === 'uuid' || type === 'text' || type.startsWith('character') || type.startsWith('varchar')) {
      return `'${pkValue}'`;
    }
    return String(pkValue);
  };

  // Generate sample value based on column type
  const getSampleValue = (colType: string, colName: string, isPrimaryKey = false, forUpdate = false): string => {
    const type = colType.toLowerCase();
    const name = colName.toLowerCase();

    const sampleUuid = () => {
      const hex = () => Math.floor(Math.random() * 16).toString(16);
      const seg = (n: number) => Array(n).fill(0).map(hex).join('');
      return `'${seg(8)}-${seg(4)}-4${seg(3)}-${seg(4)}-${seg(12)}'`;
    };

    if (type === 'uuid' || type.includes('uuid')) return sampleUuid();
    if (isPrimaryKey && name === 'id' && (type === 'text' || type.startsWith('character') || type.startsWith('varchar'))) {
      return sampleUuid();
    }

    if (!isPrimaryKey && !forUpdate) {
      const existingValue = getExistingValue(colName);
      if (existingValue) return existingValue;
    }

    if (type === 'integer' || type === 'int4' || type === 'int') return '1';
    if (type === 'bigint' || type === 'int8') return '1';
    if (type === 'smallint' || type === 'int2') return '1';
    if (type === 'serial' || type === 'serial4') return 'DEFAULT';
    if (type === 'bigserial' || type === 'serial8') return 'DEFAULT';
    if (type === 'real' || type === 'float4') return '1.5';
    if (type === 'double precision' || type === 'float8') return '1.5';
    if (type.startsWith('numeric') || type.startsWith('decimal')) return '100.00';
    if (type === 'boolean' || type === 'bool') return 'true';
    if (type.includes('timestamp')) return 'NOW()';
    if (type === 'date') return 'CURRENT_DATE';
    if (type.includes('time')) return 'CURRENT_TIME';
    if (type === 'jsonb' || type === 'json') return "'{}'::jsonb";
    if (type.includes('[]') || type.startsWith('array')) return "'{}'";

    if (name.includes('email')) return "'user@example.com'";
    if (name.includes('phone')) return "'+1234567890'";
    if (name === 'name' || name.endsWith('_name')) return forUpdate ? "'Updated Name'" : "'Sample Name'";
    if (name.includes('description')) return "'Sample description'";
    if (name.includes('icon')) return "'🎯'";

    if (type === 'text' || type.startsWith('character') || type.startsWith('varchar')) {
      return forUpdate ? "'updated_value'" : "'sample_value'";
    }

    return "'value'";
  };

  // Generate query
  const generateQuery = (queryType: QueryType) => {
    if (!targetTable) return;

    const [schema, table] = targetTable.includes(".")
      ? targetTable.split(".")
      : ["public", targetTable];

    const insertableColumns = columns.filter(c => {
      const colType = c.data_type.toLowerCase();
      const colName = c.name.toLowerCase();
      if (c.is_primary_key) {
        if (colType.includes('serial')) return false;
        if (colType === 'uuid' && c.default_value) return false;
        if (colType === 'integer' && c.default_value?.includes('nextval')) return false;
      }
      if ((colName === 'created_at' || colName === 'updated_at' || colName === 'modified_at') && c.default_value) {
        return false;
      }
      return true;
    });

    const updatableColumns = columns.filter(c => {
      if (c.is_primary_key) return false;
      const name = c.name.toLowerCase();
      if (['created_at', 'modified_at'].includes(name)) return false;
      return true;
    });

    const pkColumn = columns.find(c => c.is_primary_key);
    const firstRowPk = getFirstRowPkValue();

    let template = "";
    switch (queryType) {
      case "INSERT": {
        if (insertableColumns.length === 0) {
          template = `INSERT INTO ${schema}.${table} DEFAULT VALUES;`;
        } else {
          const colNames = insertableColumns.map(c => c.name).join(', ');
          const colValues = insertableColumns.map(c => getSampleValue(c.data_type, c.name, c.is_primary_key)).join(', ');
          template = `INSERT INTO ${schema}.${table} (${colNames})\nVALUES (${colValues});`;
        }
        break;
      }
      case "UPDATE": {
        const columnsToUpdate = updatableColumns.slice(0, 3);
        const setClauses = columnsToUpdate.map(c =>
          `${c.name} = ${getSampleValue(c.data_type, c.name, c.is_primary_key, true)}`
        ).join(',\n       ');
        const whereClause = pkColumn && firstRowPk
          ? `${pkColumn.name} = ${firstRowPk}`
          : pkColumn ? `${pkColumn.name} = '<ID>'` : 'id = 1';
        template = `UPDATE ${schema}.${table}\nSET ${setClauses || 'column = value'}\nWHERE ${whereClause};`;
        break;
      }
      case "DELETE": {
        const whereClause = pkColumn && firstRowPk
          ? `${pkColumn.name} = ${firstRowPk}`
          : pkColumn ? `${pkColumn.name} = '<ID>'` : 'id = 1';
        template = `DELETE FROM ${schema}.${table}\nWHERE ${whereClause};`;
        break;
      }
    }

    if (sql.trim()) {
      setSql(sql + "\n\n" + template);
    } else {
      setSql(template);
    }
  };

  const hasError = result?.error != null && result.error !== "";
  const tableName = targetTable?.split('.')[1] || '';

  // Get changes for a specific table
  const getChangesForTable = (fullTableName: string): DryRunChange[] => {
    if (!result?.changes) return [];
    return result.changes.filter(c => `${c.schema}.${c.table}` === fullTableName);
  };

  // Get inserted rows from result
  const getInsertedRows = (fullTableName: string): Record<string, unknown>[] => {
    return getChangesForTable(fullTableName)
      .filter(c => c.type === "INSERT" && c.after)
      .map(c => c.after!);
  };

  // Format cell value for display
  const formatCellValue = (value: unknown): string => {
    if (value === null || value === undefined) return 'NULL';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  // Toggle accordion
  const toggleExpanded = (tableName: string) => {
    setExpandedTables(prev => {
      const next = new Set(prev);
      if (next.has(tableName)) {
        next.delete(tableName);
      } else {
        next.add(tableName);
      }
      return next;
    });
  };

  // Render data table with result highlighting
  const renderDataTable = (
    tableFullName: string,
    cols: ColumnInfo[],
    tableRows: Record<string, unknown>[],
    loading: boolean,
    isMainTable: boolean
  ) => {
    const changes = getChangesForTable(tableFullName);
    const insertedRows = getInsertedRows(tableFullName);

    // Combine existing rows with inserted rows for display
    const displayRows = [...insertedRows, ...tableRows];

    if (loading) {
      return (
        <div className="p-4 text-center text-[10px] text-muted-foreground">
          Loading...
        </div>
      );
    }

    if (displayRows.length === 0 && changes.length === 0) {
      return (
        <div className="p-4 text-center text-[10px] text-muted-foreground">
          No data
        </div>
      );
    }

    return (
      <div className="overflow-auto">
        <table className="w-full text-xs bg-background" style={{ minWidth: 'max-content' }}>
          <thead className="sticky top-0 z-10 bg-secondary">
            <tr>
              {cols.map((col) => (
                <th key={col.name} className="px-3 py-1.5 text-left font-medium text-muted-foreground whitespace-nowrap border-b border-r border-border">
                  <div className="flex items-center gap-1">
                    {col.is_primary_key && <span className="text-accent-purple">🔑</span>}
                    <span className="truncate">{col.name}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayRows.slice(0, isMainTable ? 10 : 5).map((row, idx) => {
              // Check if this row is affected by changes
              let rowChangeType: "INSERT" | "UPDATE" | "DELETE" | null = null;

              for (const change of changes) {
                const { matches, changeType } = rowMatchesChange(row, change, cols);
                if (matches) {
                  rowChangeType = changeType;
                  break;
                }
              }

              // Check if this is an inserted row
              const isInserted = insertedRows.some(ir => {
                const pkCol = cols.find(c => c.is_primary_key);
                if (pkCol) {
                  return ir[pkCol.name] === row[pkCol.name];
                }
                return false;
              });
              if (isInserted) rowChangeType = "INSERT";

              return (
                <tr
                  key={idx}
                  className={cn(
                    "hover:bg-secondary/50",
                    rowChangeType === "INSERT" && "bg-accent-green/30",
                    rowChangeType === "UPDATE" && "bg-accent-yellow/30",
                    rowChangeType === "DELETE" && "bg-accent-red/30 line-through opacity-60"
                  )}
                >
                  {cols.map((col) => (
                    <td key={col.name} className="px-3 py-1.5 font-mono whitespace-nowrap max-w-[150px] truncate border-b border-r border-border/30">
                      <span className={row[col.name] === null ? 'text-muted-foreground italic' : ''}>
                        {formatCellValue(row[col.name])}
                      </span>
                    </td>
                  ))}
                </tr>
              );
            })}
            {displayRows.length > (isMainTable ? 10 : 5) && (
              <tr>
                <td colSpan={cols.length} className="px-3 py-1.5 text-center text-muted-foreground text-xs">
                  ... {displayRows.length - (isMainTable ? 10 : 5)} more
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  // Count changes for a table
  const countChanges = (fullTableName: string): { insert: number; update: number; delete: number } => {
    const changes = getChangesForTable(fullTableName);
    return {
      insert: changes.filter(c => c.type === "INSERT").length,
      update: changes.filter(c => c.type === "UPDATE").length,
      delete: changes.filter(c => c.type === "DELETE").length
    };
  };

  return (
    <motion.div
      key="dryrun"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 flex flex-col overflow-hidden"
    >
      {/* Top Section: SQL Editor */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        {/* SQL Header */}
        <div className="px-3 py-2 border-b border-border flex items-center justify-between bg-card/30 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium uppercase text-muted-foreground">SQL</span>
            {targetTable && (
              <>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent-purple/20 text-accent-purple font-medium">
                  {tableName}
                </span>
                <div className="flex gap-1 ml-1">
                  <Button
                    onClick={() => generateQuery("INSERT")}
                    variant="outline"
                    size="sm"
                    className="h-5 px-1.5 text-[9px] gap-0.5"
                  >
                    <Plus className="w-2.5 h-2.5 text-accent-green" />
                    INSERT
                  </Button>
                  <Button
                    onClick={() => generateQuery("UPDATE")}
                    variant="outline"
                    size="sm"
                    className="h-5 px-1.5 text-[9px] gap-0.5"
                  >
                    <Pencil className="w-2.5 h-2.5 text-accent-yellow" />
                    UPDATE
                  </Button>
                  <Button
                    onClick={() => generateQuery("DELETE")}
                    variant="outline"
                    size="sm"
                    className="h-5 px-1.5 text-[9px] gap-0.5"
                  >
                    <Trash2 className="w-2.5 h-2.5 text-accent-red" />
                    DELETE
                  </Button>
                </div>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            {hasError && (
              <span className="text-[9px] text-accent-red flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Error
              </span>
            )}
            <Button
              onClick={onRun}
              disabled={isRunning || !sql.trim()}
              size="sm"
              className="h-6 px-2 text-[10px] gap-1"
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="w-3 h-3" />
                  Preview
                </>
              )}
            </Button>
          </div>
        </div>

        {/* SQL Editor */}
        <div className="flex-1 p-2 overflow-hidden min-h-0">
          <Textarea
            value={sql}
            onChange={(e) => setSql(e.target.value)}
            placeholder="Write your SQL here..."
            className="h-full resize-none font-mono text-xs bg-card border-border focus-visible:ring-accent-purple/50"
          />
        </div>

        {/* Error Display */}
        {hasError && (
          <div className="px-3 pb-2 shrink-0">
            <div className="p-2 rounded bg-accent-red/10 text-[10px] border border-accent-red/20">
              <p className="text-accent-red font-mono break-all">{result?.error}</p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Section: Tables with Data */}
      {targetTable && (
        <div
          ref={containerRef}
          style={{ height: bottomHeight }}
          className="border-t border-border flex flex-col overflow-hidden shrink-0 relative"
        >
          {/* Resize Handle */}
          <div
            onMouseDown={handleVerticalResize}
            className="absolute top-0 left-0 right-0 h-1 cursor-ns-resize z-10 hover:bg-accent-purple/30 transition-colors"
          />
          <div className="flex-1 flex overflow-hidden pt-1">
            {/* Columns Panel (Left) */}
            <div
              style={{ width: leftPanelWidth }}
              className="border-r border-border flex flex-col bg-secondary/30 shrink-0 relative"
            >
              <div className="px-3 py-1.5 border-b border-border flex items-center gap-2 shrink-0 bg-secondary">
                <span className="text-accent-purple">🔑</span>
                <span className="text-xs font-medium text-foreground truncate">{tableName}</span>
                <span className="text-xs text-muted-foreground ml-auto">{columns.length} cols</span>
              </div>
              <div className="flex-1 overflow-auto p-2 space-y-1">
                {mainTableData.loading ? (
                  <div className="p-3 text-center text-xs text-muted-foreground">
                    Loading...
                  </div>
                ) : columns.length === 0 ? (
                  <div className="p-3 text-center text-xs text-muted-foreground">
                    No columns
                  </div>
                ) : (
                  columns.map((col) => (
                    <div
                      key={col.name}
                      className="px-3 py-1.5 rounded text-xs bg-background flex items-center gap-2 border border-border/50"
                    >
                      {col.is_primary_key && (
                        <span className="text-accent-purple shrink-0">🔑</span>
                      )}
                      <span className="font-medium truncate flex-1">{col.name}</span>
                      <span className="text-muted-foreground text-[10px] shrink-0">
                        {col.data_type.length > 12 ? col.data_type.slice(0, 10) + '…' : col.data_type}
                      </span>
                    </div>
                  ))
                )}
              </div>
              {/* Horizontal Resize Handle */}
              <div
                onMouseDown={handleHorizontalResize}
                className="absolute right-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-accent-purple/40 transition-colors"
              />
            </div>

            {/* Data Panel (Right) - Scrollable with main + related tables */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-auto">
                {/* Main Table Data */}
                <div className="border-b border-border">
                  <div className="px-3 py-2 bg-secondary flex items-center gap-2 sticky top-0 z-10">
                    <Table2 className="w-4 h-4 text-accent-purple" />
                    <span className="text-xs font-medium text-foreground">{targetTable}</span>
                    {(() => {
                      const counts = countChanges(targetTable);
                      const total = counts.insert + counts.update + counts.delete;
                      if (total === 0) return null;
                      return (
                        <div className="flex gap-1 ml-auto">
                          {counts.insert > 0 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent-green/20 text-accent-green">+{counts.insert}</span>
                          )}
                          {counts.update > 0 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent-yellow/20 text-accent-yellow">~{counts.update}</span>
                          )}
                          {counts.delete > 0 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent-red/20 text-accent-red">-{counts.delete}</span>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                  {renderDataTable(targetTable, columns, rows, mainTableData.loading, true)}
                </div>

                {/* Related Tables (Accordion) */}
                {relatedTables.map((relatedTable) => {
                  const data = relatedTablesData[relatedTable];
                  const isExpanded = expandedTables.has(relatedTable);
                  const counts = countChanges(relatedTable);
                  const hasChanges = counts.insert + counts.update + counts.delete > 0;
                  const relatedTableName = relatedTable.split('.')[1];

                  return (
                    <div key={relatedTable} className="border-b border-border">
                      <div
                        onClick={() => toggleExpanded(relatedTable)}
                        className={cn(
                          "px-3 py-1.5 flex items-center gap-2 cursor-pointer hover:bg-secondary/30 transition-colors",
                          hasChanges && "bg-secondary/20"
                        )}
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                        )}
                        <Link2 className="w-4 h-4 text-accent-purple shrink-0" />
                        <span className="text-xs font-medium text-accent-purple">{relatedTableName}</span>
                        {hasChanges && (
                          <div className="flex gap-1 ml-auto">
                            {counts.insert > 0 && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent-green/20 text-accent-green">+{counts.insert}</span>
                            )}
                            {counts.update > 0 && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent-yellow/20 text-accent-yellow">~{counts.update}</span>
                            )}
                            {counts.delete > 0 && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent-red/20 text-accent-red">-{counts.delete}</span>
                            )}
                          </div>
                        )}
                      </div>
                      <AnimatePresence>
                        {isExpanded && data && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            {renderDataTable(relatedTable, data.columns, data.rows, data.loading, false)}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
