/**
 * ERD View Component - Main ERD visualization
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { GitBranch, Table2, Key, Eye, Loader2 } from "lucide-react";
import {
  ReactFlow,
  Background,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import Dagre from "@dagrejs/dagre";
import { tauriCommands } from "../../lib/tauri";
import { ERDViewProps, TableNodeData, NODE_WIDTH } from "../../types";
import { TableNode } from "./TableNode";
import { CardinalityEdge } from "./CardinalityEdge";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";

const nodeTypes = { tableNode: TableNode };
const edgeTypes = { cardinality: CardinalityEdge };

export function ERDView({ tables, foreignKeys, watchedTables, onHoveredTableChange }: ERDViewProps) {
  const [columnsMap, setColumnsMap] = useState<Map<string, { name: string; type: string; isPrimaryKey: boolean }[]>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSchema, setSelectedSchema] = useState<string>("public");

  // Get unique schemas from tables
  const schemas = useMemo(() => {
    const schemaSet = new Set(tables.map(t => t.schema));
    return Array.from(schemaSet).sort();
  }, [tables]);

  // Set default schema to "public" if available, otherwise first schema
  useEffect(() => {
    if (schemas.length > 0 && !schemas.includes(selectedSchema)) {
      setSelectedSchema(schemas.includes("public") ? "public" : schemas[0]);
    }
  }, [schemas, selectedSchema]);

  // Filter tables by selected schema
  const filteredTables = useMemo(() => {
    return tables.filter(t => t.schema === selectedSchema);
  }, [tables, selectedSchema]);

  // Filter foreign keys by selected schema (both ends must be in the schema)
  const filteredForeignKeys = useMemo(() => {
    return foreignKeys.filter(fk =>
      fk.from_schema === selectedSchema && fk.to_schema === selectedSchema
    );
  }, [foreignKeys, selectedSchema]);

  // Load columns for all tables
  useEffect(() => {
    const loadColumns = async () => {
      setIsLoading(true);
      const newColumnsMap = new Map<string, { name: string; type: string; isPrimaryKey: boolean }[]>();

      // Load columns in parallel (batch of 10)
      const batches = [];
      for (let i = 0; i < tables.length; i += 10) {
        batches.push(tables.slice(i, i + 10));
      }

      for (const batch of batches) {
        await Promise.all(
          batch.map(async (table) => {
            try {
              const cols = await tauriCommands.getColumns(table.schema, table.name);
              newColumnsMap.set(
                `${table.schema}.${table.name}`,
                cols.map(c => ({
                  name: c.name,
                  type: c.data_type.replace('character varying', 'varchar').replace('timestamp without time zone', 'timestamp'),
                  isPrimaryKey: c.is_primary_key,
                }))
              );
            } catch (err) {
              console.error(`Failed to load columns for ${table.schema}.${table.name}:`, err);
            }
          })
        );
      }

      setColumnsMap(newColumnsMap);
      setIsLoading(false);
    };

    if (tables.length > 0) {
      loadColumns();
    } else {
      setIsLoading(false);
    }
  }, [tables]);

  // Track selected/hovered node for edge highlighting
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  // Track pinned node (clicked to keep details visible)
  const [pinnedNode, setPinnedNode] = useState<string | null>(null);
  // Track zoom level for adaptive display (start with zoomed out state)
  const [zoomLevel, setZoomLevel] = useState(0.3);

  // Use Dagre for hierarchical layout (like Liam ERD)
  // Left-to-Right: tables that reference others → referenced tables
  const { layoutedNodes, layoutedEdges, isolatedCount, isolatedTablesList } = useMemo(() => {
    // Separate tables with FK connections from isolated tables
    const connectedTableNames = new Set<string>();
    filteredForeignKeys.forEach(fk => {
      connectedTableNames.add(`${fk.from_schema}.${fk.from_table}`);
      connectedTableNames.add(`${fk.to_schema}.${fk.to_table}`);
    });

    const connectedTables = filteredTables.filter(t => connectedTableNames.has(`${t.schema}.${t.name}`));
    const isolatedTables = filteredTables.filter(t => !connectedTableNames.has(`${t.schema}.${t.name}`));

    // Create dagre graph for connected tables
    const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
    g.setGraph({
      rankdir: 'LR',      // Left to Right
      nodesep: 150,       // Vertical spacing between nodes
      ranksep: 250,       // Horizontal spacing between ranks (more space for connections)
      marginx: 80,
      marginy: 80,
      acyclicer: 'greedy',
      ranker: 'network-simplex',
    });

    // Add connected nodes with extra padding for spacing
    const actualNodeWidth = NODE_WIDTH * 1.5; // Match the 1.5x width used in TableNode
    connectedTables.forEach(table => {
      const fullName = `${table.schema}.${table.name}`;
      const cols = columnsMap.get(fullName) || [];
      // Use a minimum height even when columns aren't loaded yet
      const colCount = cols.length > 0 ? cols.slice(0, 8).length : 5; // Default to 5 columns worth of height
      const nodeHeight = Math.max(44 + colCount * 32 + (cols.length > 8 ? 32 : 0), 180);
      // Add significant padding to create visual spacing
      g.setNode(fullName, { width: actualNodeWidth + 150, height: nodeHeight + 120 });
    });

    // Add edges
    filteredForeignKeys.forEach((fk, index) => {
      const sourceId = `${fk.from_schema}.${fk.from_table}`;
      const targetId = `${fk.to_schema}.${fk.to_table}`;
      if (g.hasNode(sourceId) && g.hasNode(targetId)) {
        g.setEdge(sourceId, targetId, { id: `fk-${index}` });
      }
    });

    // Run layout
    Dagre.layout(g);

    // Generate nodes for connected tables only (isolated tables shown in side panel)
    const nodes: Node<TableNodeData>[] = connectedTables.map((table): Node<TableNodeData> => {
      const fullName = `${table.schema}.${table.name}`;
      const nodeWithPosition = g.node(fullName);
      const cols = columnsMap.get(fullName) || [];

      return {
        id: fullName,
        type: 'tableNode',
        position: {
          x: nodeWithPosition.x - NODE_WIDTH / 2,
          y: nodeWithPosition.y,
        },
        data: {
          label: table.name,
          schema: table.schema,
          table: table.name,
          columns: cols,
          isWatched: watchedTables.includes(fullName),
        },
      };
    });

    // Generate edges with bezier curves (purple color)
    const edges: Edge[] = filteredForeignKeys
      .filter(fk => {
        const sourceId = `${fk.from_schema}.${fk.from_table}`;
        const targetId = `${fk.to_schema}.${fk.to_table}`;
        return connectedTableNames.has(sourceId) && connectedTableNames.has(targetId);
      })
      .map((fk, index): Edge => {
        const sourceId = `${fk.from_schema}.${fk.from_table}`;
        const targetId = `${fk.to_schema}.${fk.to_table}`;

        return {
          id: `fk-${index}`,
          source: sourceId,
          target: targetId,
          type: 'cardinality',
          animated: false,
          data: { sourceId, targetId, fkColumn: fk.from_column, isHighlighted: false },
        };
      });

    // Return isolated tables separately (not in ReactFlow)
    const isolatedTablesList = isolatedTables.map(table => ({
      fullName: `${table.schema}.${table.name}`,
      table: table.name,
      schema: table.schema,
      columns: columnsMap.get(`${table.schema}.${table.name}`) || [],
      isWatched: watchedTables.includes(`${table.schema}.${table.name}`),
    }));

    return {
      layoutedNodes: nodes,
      layoutedEdges: edges,
      isolatedCount: isolatedTables.length,
      isolatedTablesList,
    };
  }, [filteredTables, filteredForeignKeys, columnsMap, watchedTables]);

  // Build relationship map for highlighting
  const { connectedNames, relatedNodesMap } = useMemo(() => {
    const connected = new Set<string>();
    const relatedMap = new Map<string, Set<string>>();

    layoutedEdges.forEach(edge => {
      const edgeData = edge.data as { sourceId: string; targetId: string } | undefined;
      if (edgeData) {
        connected.add(edgeData.sourceId);
        connected.add(edgeData.targetId);

        // Build bidirectional relationship map
        if (!relatedMap.has(edgeData.sourceId)) {
          relatedMap.set(edgeData.sourceId, new Set());
        }
        if (!relatedMap.has(edgeData.targetId)) {
          relatedMap.set(edgeData.targetId, new Set());
        }
        relatedMap.get(edgeData.sourceId)!.add(edgeData.targetId);
        relatedMap.get(edgeData.targetId)!.add(edgeData.sourceId);
      }
    });

    return { connectedNames: connected, relatedNodesMap: relatedMap };
  }, [layoutedEdges]);

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);

  // Update nodes when layout changes (schema change, etc.) - preserve user positions where possible
  const prevLayoutRef = useRef<{ key: string; nodeIds: string } | null>(null);
  useEffect(() => {
    // Separate key for node IDs (layout structure) and columns (data updates)
    const nodeIdsKey = layoutedNodes.map(n => n.id).sort().join(',');
    const columnsKey = layoutedNodes.map(n => {
      const nodeData = n.data as TableNodeData;
      return `${n.id}:${nodeData.columns?.length || 0}`;
    }).sort().join(',');

    const isStructureChange = prevLayoutRef.current?.nodeIds !== nodeIdsKey;
    const isDataChange = prevLayoutRef.current?.key !== columnsKey;

    if (isStructureChange) {
      // Structure changed (different tables) - use new layout positions
      setNodes(layoutedNodes);
    } else if (isDataChange) {
      // Only data changed (columns loaded) - preserve user positions
      setNodes(currentNodes => {
        const positionMap = new Map(currentNodes.map(n => [n.id, n.position]));
        return layoutedNodes.map(node => ({
          ...node,
          position: positionMap.get(node.id) || node.position,
        }));
      });
    }

    prevLayoutRef.current = { key: columnsKey, nodeIds: nodeIdsKey };
  }, [layoutedNodes, setNodes]);

  // Update edges when layout changes
  useEffect(() => {
    setEdges(layoutedEdges);
  }, [layoutedEdges, setEdges]);

  // Update node isWatched state when watchedTables changes
  useEffect(() => {
    setNodes(currentNodes => currentNodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        isWatched: watchedTables.includes(node.id),
      },
    })));
  }, [watchedTables, setNodes]);

  // Debounced zoom level for node updates (avoid too many re-renders)
  const [debouncedZoom, setDebouncedZoom] = useState(0.3);
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedZoom(zoomLevel);
    }, 100); // 100ms debounce
    return () => clearTimeout(timer);
  }, [zoomLevel]);

  // Update node highlight state and zoom level when needed
  useEffect(() => {
    const isConnectedTable = hoveredNode !== null && connectedNames.has(hoveredNode);
    const relatedNodes = hoveredNode ? (relatedNodesMap.get(hoveredNode) || new Set<string>()) : new Set<string>();

    setNodes(currentNodes => currentNodes.map(node => {
      const isHovered = hoveredNode !== null && node.id === hoveredNode;
      const isRelated = relatedNodes.has(node.id);
      const isHighlighted = isConnectedTable && (isHovered || isRelated);

      return {
        ...node,
        data: {
          ...node.data,
          isHighlighted: isHighlighted || undefined,
          zoomLevel: debouncedZoom,
        },
      };
    }));
  }, [hoveredNode, connectedNames, relatedNodesMap, setNodes, debouncedZoom]);

  // Update edge highlight state when hovered node changes
  useEffect(() => {
    const isConnectedTable = hoveredNode && connectedNames.has(hoveredNode);

    setEdges(currentEdges => currentEdges.map(edge => {
      const edgeData = edge.data as { sourceId: string; targetId: string; fkColumn: string } | undefined;
      const isConnected = isConnectedTable && edgeData && (edgeData.sourceId === hoveredNode || edgeData.targetId === hoveredNode);

      return {
        ...edge,
        data: {
          ...edgeData,
          isHighlighted: isConnected,
        },
        zIndex: isConnected ? 1000 : 0,
      };
    }));
  }, [hoveredNode, connectedNames, setEdges]);

  // Handle node hover
  const onNodeMouseEnter = useCallback((_: React.MouseEvent, node: Node) => {
    // If hovering a different node, clear pinned state
    if (pinnedNode && node.id !== pinnedNode) {
      setPinnedNode(null);
    }
    setHoveredNode(node.id);
  }, [pinnedNode]);

  const onNodeMouseLeave = useCallback(() => {
    // Only clear if not pinned
    if (!pinnedNode) {
      setHoveredNode(null);
    }
  }, [pinnedNode]);

  // Handle node click - pin the node
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setPinnedNode(node.id);
    setHoveredNode(node.id);
  }, []);

  // Handle node drag start - also pin the node
  const onNodeDragStart = useCallback((_: React.MouseEvent, node: Node) => {
    setPinnedNode(node.id);
    setHoveredNode(node.id);
  }, []);

  // Notify parent of hovered table changes
  useEffect(() => {
    if (!onHoveredTableChange) return;

    if (!hoveredNode) {
      onHoveredTableChange(null);
      return;
    }

    const [schema, table] = hoveredNode.includes('.')
      ? [hoveredNode.split('.')[0], hoveredNode.split('.').slice(1).join('.')]
      : ['public', hoveredNode];

    const columns = columnsMap.get(hoveredNode) || [];
    const outgoingFKs = foreignKeys.filter(fk =>
      `${fk.from_schema}.${fk.from_table}` === hoveredNode
    );
    const incomingFKs = foreignKeys.filter(fk =>
      `${fk.to_schema}.${fk.to_table}` === hoveredNode
    );

    onHoveredTableChange({
      fullName: hoveredNode,
      schema,
      table,
      columns,
      outgoingFKs,
      incomingFKs,
    });
  }, [hoveredNode, columnsMap, foreignKeys, onHoveredTableChange]);

  if (isLoading) {
    return (
      <motion.div
        key="erd-loading"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex-1 flex items-center justify-center"
      >
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-accent-purple" />
          <p className="text-sm text-muted-foreground">Loading schema...</p>
        </div>
      </motion.div>
    );
  }

  if (tables.length === 0) {
    return (
      <motion.div
        key="erd-empty"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex-1 flex items-center justify-center text-muted-foreground"
      >
        <div className="text-center">
          <GitBranch className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-sm mb-2">No tables found</p>
          <p className="text-xs opacity-70">Connect to a database to view ERD</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      key="erd"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 flex flex-col overflow-hidden"
    >
      {/* ERD Header */}
      <div className="h-12 px-4 py-2 border-b border-border bg-muted/30 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="flex items-center gap-2 shrink-0">
            <GitBranch className="w-4 h-4 text-accent-cyan" />
            <span className="text-xs font-medium">ERD</span>
          </div>

          {/* Schema Selector - Button Style */}
          <div className="flex items-center gap-0.5 bg-secondary rounded-lg p-0.5 border border-border shrink-0">
            {schemas.map(schema => (
              <Button
                key={schema}
                onClick={() => setSelectedSchema(schema)}
                variant={selectedSchema === schema ? "default" : "ghost"}
                size="sm"
                className={cn(
                  "px-2 py-0.5 text-[10px] font-medium rounded h-auto",
                  selectedSchema === schema && "bg-accent-purple text-white hover:bg-accent-purple/90"
                )}
              >
                {schema}
              </Button>
            ))}
          </div>

          <span className="text-[10px] text-muted-foreground truncate">
            {filteredTables.length - isolatedCount} tables · {filteredForeignKeys.length} relations
          </span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground shrink-0">
          <span>Scroll to zoom</span>
        </div>
      </div>

      {/* ERD Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Isolated Tables Panel (Left) - scrollable list */}
        {isolatedTablesList.length > 0 && (
          <div className="w-56 border-r border-border bg-muted/30 flex flex-col">
            <div className="px-3 py-2 border-b border-border flex items-center gap-2 shrink-0">
              <Table2 className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-[10px] font-medium text-muted-foreground">
                Isolated ({isolatedTablesList.length})
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-3" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {isolatedTablesList.map((table) => (
                <div
                  key={table.fullName}
                  className="bg-secondary border border-border rounded-lg"
                >
                  {/* Table Header */}
                  <div className="px-2.5 py-1.5 border-b border-border flex items-center gap-1.5 bg-muted">
                    <Table2 className="w-3 h-3 shrink-0 text-muted-foreground" />
                    <span className="text-[10px] font-medium truncate flex-1">{table.table}</span>
                    {table.isWatched && (
                      <Eye className="w-2.5 h-2.5 text-accent-green shrink-0" />
                    )}
                  </div>
                  {/* Columns - show all, no scroll */}
                  <div>
                    {table.columns.map((col, idx) => (
                      <div
                        key={idx}
                        className="px-2.5 py-0.5 text-[9px] flex items-center gap-1 border-b border-border/20 last:border-b-0"
                      >
                        {col.isPrimaryKey ? (
                          <Key className="w-2 h-2 text-accent-yellow shrink-0" />
                        ) : (
                          <span className="w-2 h-2 shrink-0 text-muted-foreground">◇</span>
                        )}
                        <span className={cn(
                          "truncate flex-1",
                          col.isPrimaryKey ? "text-accent-yellow" : "text-foreground"
                        )}>
                          {col.name}
                        </span>
                        <span className="text-muted-foreground text-[8px] opacity-60">{col.type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ERD Canvas */}
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeMouseEnter={onNodeMouseEnter}
            onNodeMouseLeave={onNodeMouseLeave}
            onNodeClick={onNodeClick}
            onNodeDragStart={onNodeDragStart}
            onMove={(_, viewport) => setZoomLevel(viewport.zoom)}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            fitViewOptions={{ padding: 0.2, maxZoom: 1 }}
            minZoom={0.1}
            maxZoom={2}
            proOptions={{ hideAttribution: true }}
          >
            <Background color="var(--border)" gap={20} size={1} />
          </ReactFlow>

          {/* Zoom Level Indicator */}
          <div className="absolute bottom-2 right-2 px-2 py-1 bg-secondary/80 rounded text-[10px] text-muted-foreground">
            {Math.round(zoomLevel * 100)}%
          </div>
        </div>
      </div>
    </motion.div>
  );
}

