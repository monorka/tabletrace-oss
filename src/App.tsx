import React, { useState, useEffect } from "react";
import {
  Database,
  Activity,
  GitBranch,
  Settings,
  Zap,
  Table2,
  Clock,
  LogOut,
  Eye,
  LayoutGrid,
  PanelRightOpen,
  PanelBottomOpen,
  FlaskConical,
  AlertTriangle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useConnectionStore, getRecentChangesForTable } from "./stores/connectionStore";
import { ConnectionDialog } from "./components/ConnectionDialog";
import { StatusIndicator, SidebarButton } from "./components/ui";
import { WelcomeView, ConnectedView, SettingsDialog } from "./components/Views";
import { UpdateChecker } from "./components/UpdateChecker";
import {
  TabType,
  EventLogPosition,
  LayoutSettings,
  AppSettings,
} from "./types";
import {
  loadLayoutSettings,
  saveLayoutSettings,
  loadAppSettings,
  saveAppSettings,
} from "./utils";

function App() {
  const {
    status,
    tables,
    foreignKeys,
    watchedTables,
    watchedTableData,
    events,
    disconnect,
    refreshTables,
    startWatching,
    stopWatching,
    selectTable,
    selectedTable,
    selectedTableColumns,
    selectedTableRows,
    selectedTableRowCount,
    config,
    getWatchedTableData,
    clearEvents,
    tablesWithChanges,
    errorMessage
  } = useConnectionStore();

  const [activeTab, setActiveTab] = useState<TabType>("tables");
  const [showConnectionDialog, setShowConnectionDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [layoutSettings, setLayoutSettings] = useState<LayoutSettings>(loadLayoutSettings);
  const [appSettings, setAppSettings] = useState<AppSettings>(loadAppSettings);
  const [showLayoutMenu, setShowLayoutMenu] = useState(false);

  // Save layout settings when changed
  useEffect(() => {
    saveLayoutSettings(layoutSettings);
  }, [layoutSettings]);

  // Save app settings when changed and refresh tables
  const prevAppSettingsRef = React.useRef(appSettings);
  useEffect(() => {
    saveAppSettings(appSettings);

    // If maxDisplayRows changed, refresh all watched tables
    if (prevAppSettingsRef.current.maxDisplayRows !== appSettings.maxDisplayRows) {
      watchedTables.forEach(fullName => {
        const [schema, table] = fullName.split(".");
        useConnectionStore.getState().refreshWatchedTable(schema, table);
      });
    }
    prevAppSettingsRef.current = appSettings;
  }, [appSettings, watchedTables]);

  const toggleTableList = () => {
    setLayoutSettings(prev => ({ ...prev, tableListOpen: !prev.tableListOpen }));
  };

  const setEventLogPosition = (position: EventLogPosition) => {
    setLayoutSettings(prev => ({ ...prev, eventLogPosition: position }));
    setShowLayoutMenu(false);
  };

  // Get display connection info
  const connectionInfo = config
    ? `${config.user}@${config.host}:${config.port}/${config.database}`
    : "";

  // Helper to get recent changes for a table
  const getChangesForTable = (schema: string, table: string) => {
    return getRecentChangesForTable(events, schema, table);
  };

  // Stop watching all tables
  const stopAllWatch = async () => {
    for (const fullName of watchedTables) {
      const [schema, table] = fullName.split('.');
      await stopWatching(schema, table);
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-[var(--bg-primary)]">
      {/* Update Checker */}
      <UpdateChecker />

      {/* Header */}
      <header className="h-12 border-b border-[var(--border-color)] flex items-center justify-between px-4 bg-[var(--bg-secondary)] no-select">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-[var(--accent-purple)]" />
            <span className="font-semibold text-sm tracking-wide">TableTrace</span>
          </div>
          <span className="text-xs text-[var(--text-secondary)]">v0.1.0</span>
        </div>

        <div className="flex items-center gap-4">
          {/* Connection Status */}
          <div className="flex items-center gap-2 group relative">
            <StatusIndicator status={status} />
            <span className="text-xs text-[var(--text-secondary)]">
              {status === "disconnected" && "Not Connected"}
              {status === "connecting" && "Connecting..."}
              {status === "connected" && (
                <span className="flex items-center gap-1">
                  <span className="font-medium text-[var(--text-primary)]">{config?.database}</span>
                  <span className="opacity-60">@</span>
                  <span>{config?.host}:{config?.port}</span>
                </span>
              )}
              {status === "error" && "Connection Error"}
            </span>
            {/* Tooltip with full connection info */}
            {status === "connected" && connectionInfo && (
              <div className="absolute top-full right-0 mt-2 px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap">
                <div className="text-[10px] text-[var(--text-secondary)] mb-1">Connection</div>
                <div className="text-xs font-mono">{connectionInfo}</div>
              </div>
            )}
          </div>

          {status === "disconnected" || status === "error" ? (
            <button
              onClick={() => setShowConnectionDialog(true)}
              className="px-3 py-1.5 text-xs font-medium bg-[var(--accent-purple)] hover:bg-[var(--accent-purple)]/80 rounded-md transition-colors"
            >
              Connect
            </button>
          ) : status === "connected" ? (
            <button
              onClick={disconnect}
              className="px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--accent-red)] hover:bg-[var(--accent-red)]/10 rounded-md transition-colors flex items-center gap-1.5"
            >
              <LogOut className="w-3 h-3" />
              Disconnect
            </button>
          ) : null}

          {/* Layout Controls */}
          <div className="relative flex items-center">
            <button
              onClick={() => setShowLayoutMenu(!showLayoutMenu)}
              className="p-1.5 hover:bg-[var(--bg-tertiary)] rounded-md transition-colors flex items-center justify-center"
              title="Layout settings"
            >
              <LayoutGrid className="w-4 h-4 text-[var(--text-secondary)]" />
            </button>

            {/* Layout Menu Dropdown */}
            <AnimatePresence>
              {showLayoutMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 top-full mt-1 w-48 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg shadow-xl z-50 py-1"
                >
                  <div className="px-3 py-1.5 text-[10px] font-medium text-[var(--text-secondary)] uppercase">
                    Event Log Position
                  </div>
                  <button
                    onClick={() => setEventLogPosition("right")}
                    className={`w-full px-3 py-1.5 text-xs text-left hover:bg-[var(--bg-tertiary)] flex items-center gap-2 ${
                      layoutSettings.eventLogPosition === "right" ? "text-[var(--accent-purple)]" : ""
                    }`}
                  >
                    <PanelRightOpen className="w-4 h-4" />
                    Right Panel
                    {layoutSettings.eventLogPosition === "right" && <span className="ml-auto">✓</span>}
                  </button>
                  <button
                    onClick={() => setEventLogPosition("bottom")}
                    className={`w-full px-3 py-1.5 text-xs text-left hover:bg-[var(--bg-tertiary)] flex items-center gap-2 ${
                      layoutSettings.eventLogPosition === "bottom" ? "text-[var(--accent-purple)]" : ""
                    }`}
                  >
                    <PanelBottomOpen className="w-4 h-4" />
                    Bottom Panel
                    {layoutSettings.eventLogPosition === "bottom" && <span className="ml-auto">✓</span>}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={() => setShowSettingsDialog(true)}
            className="p-1.5 mr-2 hover:bg-[var(--bg-tertiary)] rounded-md transition-colors flex items-center justify-center"
            title="Settings"
          >
            <Settings className="w-4 h-4 text-[var(--text-secondary)]" />
          </button>
        </div>
      </header>

      {/* Connection Error Banner */}
      <AnimatePresence>
        {status === "error" && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-[var(--accent-red)]/10 border-b border-[var(--accent-red)]/30 overflow-hidden"
          >
            <div className="px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[var(--accent-red)]" />
                <span className="text-sm text-[var(--accent-red)]">
                  {errorMessage || "Connection lost"}
                </span>
              </div>
              <button
                onClick={() => setShowConnectionDialog(true)}
                className="px-3 py-1 text-xs font-medium bg-[var(--accent-red)] text-white rounded-md hover:bg-[var(--accent-red)]/80 transition-colors"
              >
                Reconnect
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-12 border-r border-[var(--border-color)] bg-[var(--bg-secondary)] flex flex-col items-center py-3 gap-2 no-select">
          <SidebarButton
            icon={<Table2 className="w-5 h-5" />}
            active={activeTab === "tables"}
            onClick={() => {
              if (activeTab === "tables") {
                // Toggle table list panel when already on tables tab
                toggleTableList();
              } else {
                setActiveTab("tables");
                // Open table list if closed when switching to tables tab
                if (!layoutSettings.tableListOpen) {
                  toggleTableList();
                }
              }
            }}
            tooltip={layoutSettings.tableListOpen ? "Hide Tables" : "Show Tables"}
            highlight={!layoutSettings.tableListOpen && activeTab === "tables"}
          />
          <SidebarButton
            icon={<Clock className="w-5 h-5" />}
            active={activeTab === "timeline"}
            onClick={() => setActiveTab("timeline")}
            tooltip="Timeline"
          />
          <SidebarButton
            icon={<GitBranch className="w-5 h-5" />}
            active={activeTab === "erd"}
            onClick={() => setActiveTab("erd")}
            tooltip="ERD Graph"
          />
          <SidebarButton
            icon={<FlaskConical className="w-5 h-5" />}
            active={activeTab === "dryrun"}
            onClick={() => setActiveTab("dryrun")}
            tooltip="Dry Run (Preview SQL)"
          />
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {status === "connected" ? (
            <ConnectedView
              activeTab={activeTab}
              tables={tables}
              foreignKeys={foreignKeys}
              watchedTables={watchedTables}
              watchedTableData={watchedTableData}
              events={events}
              tablesWithChanges={tablesWithChanges}
              onRefreshTables={refreshTables}
              onStartWatch={startWatching}
              onStopWatch={stopWatching}
              onSelectTable={selectTable}
              selectedTable={selectedTable}
              selectedTableColumns={selectedTableColumns}
              selectedTableRows={selectedTableRows}
              selectedTableRowCount={selectedTableRowCount}
              getChangesForTable={getChangesForTable}
              getWatchedTableData={getWatchedTableData}
              onClearEvents={clearEvents}
              layoutSettings={layoutSettings}
              onStopAllWatch={stopAllWatch}
            />
          ) : (
            <WelcomeView
              onConnect={() => setShowConnectionDialog(true)}
              isConnecting={status === "connecting"}
            />
          )}
        </main>
      </div>

      {/* Status Bar */}
      <footer className="h-6 border-t border-[var(--border-color)] bg-[var(--bg-secondary)] flex items-center px-3 text-[10px] text-[var(--text-secondary)] gap-4 no-select">
        <div className="flex items-center gap-1.5">
          <Activity className="w-3 h-3" />
          <span>{events.length} events</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Eye className="w-3 h-3" />
          <span>{watchedTables.length} tables watched</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Database className="w-3 h-3" />
          <span>{tables.length} tables available</span>
        </div>
        <div className="flex-1" />
        <span className="text-[var(--accent-green)]">● Polling Mode</span>
      </footer>

      {/* Connection Dialog */}
      <ConnectionDialog
        isOpen={showConnectionDialog}
        onClose={() => setShowConnectionDialog(false)}
      />

      {/* Settings Dialog */}
      <SettingsDialog
        isOpen={showSettingsDialog}
        onClose={() => setShowSettingsDialog(false)}
        settings={appSettings}
        onSave={setAppSettings}
      />
    </div>
  );
}


export default App;
