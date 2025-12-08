import React, { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { useConnectionStore, getRecentChangesForTable } from "./stores/connectionStore";
import { ConnectionDialog } from "./components/ConnectionDialog";
import { WelcomeView, ConnectedView, SettingsDialog } from "./components/Views";
import { UpdateChecker } from "./components/UpdateChecker";
import { AppHeader } from "./components/AppHeader/AppHeader";
import { ConnectionErrorBanner } from "./components/ConnectionErrorBanner";
import { AppSidebar } from "./components/AppSidebar";
import { StatusBar } from "./components/StatusBar";
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
  };

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
    <div className="h-screen w-full flex flex-col bg-[var(--bg-primary)]">
      {/* Update Checker */}
      <UpdateChecker />

      {/* Header */}
      <AppHeader
        status={status}
        config={config}
        layoutSettings={layoutSettings}
        onConnect={() => setShowConnectionDialog(true)}
        onDisconnect={disconnect}
        onEventLogPositionChange={setEventLogPosition}
        onSettingsOpen={() => setShowSettingsDialog(true)}
      />

      {/* Connection Error Banner */}
      <AnimatePresence>
        {status === "error" && (
          <ConnectionErrorBanner
            errorMessage={errorMessage}
            onReconnect={() => setShowConnectionDialog(true)}
          />
        )}
      </AnimatePresence>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <AppSidebar
          activeTab={activeTab}
          layoutSettings={layoutSettings}
          onTabChange={setActiveTab}
          onToggleTableList={toggleTableList}
        />

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
      <StatusBar
        eventCount={events.length}
        watchedTableCount={watchedTables.length}
        totalTableCount={tables.length}
      />

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
