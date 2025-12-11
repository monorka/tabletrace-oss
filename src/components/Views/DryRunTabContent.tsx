/**
 * Dry Run Tab Content - 3-pane layout with table selection, SQL editor, and results
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FlaskConical, Play, Loader2, ChevronDown, ChevronUp,
  Plus, Pencil, Trash2, Eye, Table2, KeyRound, Hash
} from "lucide-react";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { cn } from "../../lib/utils";
import { DryRunResult, DryRunChange } from "../../lib/tauri";
import { WatchedTableData } from "../../stores/connectionStore";

export interface DryRunTabContentProps {
  watchedTables: string[];
  getWatchedTableData: (fullName: string) => WatchedTableData | undefined;
  sql: string;
  setSql: (sql: string) => void;
  isRunning: boolean;
  result: DryRunResult | null;
  onRun: () => void;
}

type QueryType = "INSERT" | "UPDATE" | "DELETE";

export function DryRunTabContent({
  watchedTables,
  getWatchedTableData,
  sql,
  setSql,
  isRunning,
  result,
  onRun
}: DryRunTabContentProps) {
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [showResults, setShowResults] = useState(true);

  // Get data for selected table
  const selectedTableData = selectedTable ? getWatchedTableData(selectedTable) : undefined;
  const columns = selectedTableData?.columns || [];

  // Get sample value from existing data
  const getExistingValue = (colName: string): string | null => {
    if (!selectedTableData?.rows || selectedTableData.rows.length === 0) return null;
    const value = selectedTableData.rows[0][colName];
    if (value === null || value === undefined) return null;
    if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
    if (typeof value === 'number') return String(value);
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    if (typeof value === 'object') return `'${JSON.stringify(value)}'::jsonb`;
    return null;
  };

  // Get first row's PK value for UPDATE/DELETE
  const getFirstRowPkValue = (): string | null => {
    if (!selectedTableData?.rows || selectedTableData.rows.length === 0) return null;
    const pkColumn = columns.find(c => c.is_primary_key);
    if (!pkColumn) return null;
    const pkValue = selectedTableData.rows[0][pkColumn.name];
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
    if (!selectedTable) return;

    const [schema, table] = selectedTable.includes(".")
      ? selectedTable.split(".")
      : ["public", selectedTable];

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

  const hasResult = result !== null;
  const hasError = result?.error != null && result.error !== "";

  // Group results by table
  const groupedChanges = result?.changes.reduce((acc, change) => {
    const key = `${change.schema}.${change.table}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(change);
    return acc;
  }, {} as Record<string, DryRunChange[]>) || {};

  return (
    <motion.div
      key="dryrun"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 flex flex-col overflow-hidden"
    >
      {/* Main Content - 2 columns */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Tables & Columns */}
        <div className="w-56 border-r border-border flex flex-col bg-card/50">
          {/* Tables List */}
          <div className="p-3 border-b border-border">
            <div className="flex items-center gap-2 mb-2">
              <Table2 className="w-3.5 h-3.5 text-accent-purple" />
              <span className="text-xs font-medium">Tables</span>
              <span className="text-[10px] text-muted-foreground ml-auto">
                {watchedTables.length} watching
              </span>
            </div>

            {watchedTables.length === 0 ? (
              <div className="text-[10px] text-muted-foreground py-4 text-center">
                <Eye className="w-4 h-4 mx-auto mb-1 opacity-50" />
                No tables being watched.<br />
                Watch tables from the left panel.
              </div>
            ) : (
              <div className="space-y-0.5 max-h-40 overflow-auto">
                {watchedTables.map((tableName) => {
                  const isSelected = selectedTable === tableName;
                  const shortName = tableName.includes('.') ? tableName.split('.')[1] : tableName;
                  return (
                    <button
                      key={tableName}
                      onClick={() => setSelectedTable(isSelected ? "" : tableName)}
                      className={cn(
                        "w-full text-left px-2 py-1.5 rounded text-[11px] transition-colors flex items-center gap-2",
                        isSelected
                          ? "bg-accent-purple/20 text-accent-purple"
                          : "hover:bg-secondary text-foreground"
                      )}
                    >
                      <Eye className="w-3 h-3 text-accent-green shrink-0" />
                      <span className="truncate">{shortName}</span>
                      {isSelected && (
                        <div className="w-1.5 h-1.5 rounded-full bg-accent-purple ml-auto shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Columns List */}
          <div className="flex-1 overflow-auto p-3">
            <div className="flex items-center gap-2 mb-2">
              <Hash className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-medium">Columns</span>
            </div>

            {!selectedTable ? (
              <div className="text-[10px] text-muted-foreground py-4 text-center">
                Select a table above
              </div>
            ) : columns.length === 0 ? (
              <div className="text-[10px] text-muted-foreground py-4 text-center">
                No columns found
              </div>
            ) : (
              <div className="space-y-0.5">
                {columns.map((col) => (
                  <div
                    key={col.name}
                    className="px-2 py-1 rounded text-[10px] bg-secondary/50 flex items-center gap-1.5"
                  >
                    {col.is_primary_key && (
                      <KeyRound className="w-3 h-3 text-accent-yellow shrink-0" />
                    )}
                    <span className="font-medium truncate">{col.name}</span>
                    <span className="text-muted-foreground ml-auto shrink-0">
                      {col.data_type.length > 12 ? col.data_type.slice(0, 10) + '…' : col.data_type}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Query Buttons */}
          <div className="p-3 border-t border-border space-y-1.5">
            <Button
              onClick={() => generateQuery("INSERT")}
              disabled={!selectedTable}
              variant="outline"
              size="sm"
              className="w-full h-7 text-[10px] justify-start gap-2"
            >
              <Plus className="w-3 h-3 text-accent-green" />
              INSERT
            </Button>
            <Button
              onClick={() => generateQuery("UPDATE")}
              disabled={!selectedTable}
              variant="outline"
              size="sm"
              className="w-full h-7 text-[10px] justify-start gap-2"
            >
              <Pencil className="w-3 h-3 text-accent-yellow" />
              UPDATE
            </Button>
            <Button
              onClick={() => generateQuery("DELETE")}
              disabled={!selectedTable}
              variant="outline"
              size="sm"
              className="w-full h-7 text-[10px] justify-start gap-2"
            >
              <Trash2 className="w-3 h-3 text-accent-red" />
              DELETE
            </Button>
          </div>
        </div>

        {/* Right Panel - SQL Editor */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-4 py-2 border-b border-border flex items-center justify-between bg-card/30">
            <div className="flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-accent-purple" />
              <span className="text-sm font-medium">SQL Editor</span>
              {selectedTable && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-accent-purple/20 text-accent-purple">
                  {selectedTable}
                </span>
              )}
            </div>
            <Button
              onClick={onRun}
              disabled={isRunning || !sql.trim()}
              size="sm"
              className="h-7 px-3 text-[10px] gap-1.5"
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="w-3 h-3" />
                  Preview Changes
                </>
              )}
            </Button>
          </div>

          {/* SQL Editor Area */}
          <div className="flex-1 p-4 overflow-hidden">
            <Textarea
              value={sql}
              onChange={(e) => setSql(e.target.value)}
              placeholder="Write your SQL here...

SELECT a table from the left panel, then click INSERT, UPDATE, or DELETE to generate a query template."
              className="h-full resize-none font-mono text-xs bg-card border-border focus-visible:ring-accent-purple/50"
            />
          </div>
        </div>
      </div>

      {/* Results Panel - Bottom */}
      {hasResult && (
        <div className="border-t border-border bg-card/50">
          {/* Results Header */}
          <div
            onClick={() => setShowResults(!showResults)}
            className="px-4 py-2 flex items-center justify-between cursor-pointer hover:bg-secondary/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className={cn(
                "text-xs font-medium",
                hasError ? "text-accent-red" : "text-accent-green"
              )}>
                {hasError ? "Error" : `${result?.changes.length || 0} changes`}
              </span>
              {!hasError && result?.changes && (
                <div className="flex gap-1">
                  {Object.entries(
                    result.changes.reduce((acc, c) => {
                      acc[c.type] = (acc[c.type] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)
                  ).map(([type, count]) => (
                    <span
                      key={type}
                      className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded",
                        type === "INSERT" && "bg-accent-green/20 text-accent-green",
                        type === "UPDATE" && "bg-accent-yellow/20 text-accent-yellow",
                        type === "DELETE" && "bg-accent-red/20 text-accent-red"
                      )}
                    >
                      {type === "INSERT" ? "+" : type === "UPDATE" ? "~" : "-"}{count}
                    </span>
                  ))}
                </div>
              )}
            </div>
            {showResults ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            )}
          </div>

          {/* Results Content */}
          <AnimatePresence>
            {showResults && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 max-h-[300px] overflow-auto">
                  {hasError ? (
                    <div className="p-3 rounded bg-accent-red/10 text-[11px] border border-accent-red/20">
                      <p className="text-accent-red font-mono break-all">{result?.error}</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {Object.entries(groupedChanges).map(([tableName, changes]) => (
                        <div key={tableName} className="rounded border border-border overflow-hidden">
                          {/* Table Header */}
                          <div className="px-3 py-1.5 bg-secondary/50 flex items-center gap-2">
                            <Table2 className="w-3 h-3 text-muted-foreground" />
                            <span className="text-[11px] font-medium">{tableName}</span>
                            <div className="flex gap-1 ml-auto">
                              {["INSERT", "UPDATE", "DELETE"].map(type => {
                                const count = changes.filter(c => c.type === type).length;
                                if (count === 0) return null;
                                return (
                                  <span
                                    key={type}
                                    className={cn(
                                      "text-[9px] px-1 py-0.5 rounded",
                                      type === "INSERT" && "bg-accent-green/20 text-accent-green",
                                      type === "UPDATE" && "bg-accent-yellow/20 text-accent-yellow",
                                      type === "DELETE" && "bg-accent-red/20 text-accent-red"
                                    )}
                                  >
                                    {type === "INSERT" ? "+" : type === "UPDATE" ? "~" : "-"}{count}
                                  </span>
                                );
                              })}
                            </div>
                          </div>

                          {/* Changes */}
                          {changes.map((change, idx) => {
                            const data = change.type === "DELETE" ? change.before : change.after;
                            const cols = data ? Object.keys(data) : [];

                            return (
                              <div key={idx} className={cn(
                                "border-t border-border",
                                change.type === "INSERT" && "bg-accent-green/5",
                                change.type === "UPDATE" && "bg-accent-yellow/5",
                                change.type === "DELETE" && "bg-accent-red/5"
                              )}>
                                {data && cols.length > 0 && (
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-[10px]">
                                      <thead>
                                        <tr className="bg-secondary/30">
                                          <th className="px-2 py-1 text-left font-medium text-muted-foreground w-6">
                                            {change.type === "INSERT" ? (
                                              <Plus className="w-3 h-3 text-accent-green" />
                                            ) : change.type === "UPDATE" ? (
                                              <Pencil className="w-3 h-3 text-accent-yellow" />
                                            ) : (
                                              <Trash2 className="w-3 h-3 text-accent-red" />
                                            )}
                                          </th>
                                          {cols.map((col) => (
                                            <th key={col} className="px-2 py-1 text-left font-medium text-muted-foreground whitespace-nowrap">
                                              {col}
                                            </th>
                                          ))}
                                        </tr>
                                      </thead>
                                      <tbody>
                                        <tr>
                                          <td className="px-2 py-1.5"></td>
                                          {cols.map((col) => {
                                            const value = data[col];
                                            const displayValue = value === null
                                              ? <span className="text-muted-foreground italic">NULL</span>
                                              : typeof value === 'object'
                                                ? <span className="text-accent-purple">{JSON.stringify(value)}</span>
                                                : String(value);
                                            return (
                                              <td key={col} className="px-2 py-1.5 font-mono whitespace-nowrap max-w-[150px] truncate">
                                                {displayValue}
                                              </td>
                                            );
                                          })}
                                        </tr>
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
