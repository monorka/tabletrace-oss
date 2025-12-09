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
import { SidebarInset, SidebarProvider } from "./components/ui/sidebar";
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
import { initializeTheme, applyTheme } from "./utils/theme";

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

  // Initialize and apply theme
  useEffect(() => {
    initializeTheme(appSettings.theme);
    applyTheme(appSettings.theme);
  }, [appSettings.theme]);

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
    <div className="h-screen w-full flex flex-col bg-background">
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

      {status === "connected" ? (
        <SidebarProvider
          style={{
            "--sidebar-width": "350px",
            "--sidebar-width-icon": "48px",
          } as React.CSSProperties}
          className="flex-1 min-h-0"
        >
          <AppSidebar
            activeTab={activeTab}
            layoutSettings={layoutSettings}
            onTabChange={setActiveTab}
            onToggleTableList={toggleTableList}
          />
          <SidebarInset className="flex flex-col overflow-hidden">
            <ConnectedView
              activeTab={activeTab}
              tables={tables}
              foreignKeys={foreignKeys}
              watchedTables={watchedTables}
              events={events}
              tablesWithChanges={tablesWithChanges}
              onRefreshTables={refreshTables}
              onStartWatch={startWatching}
              onStopWatch={stopWatching}
              onSelectTable={selectTable}
              selectedTable={selectedTable}
              getChangesForTable={getChangesForTable}
              getWatchedTableData={getWatchedTableData}
              onClearEvents={clearEvents}
              layoutSettings={layoutSettings}
              onStopAllWatch={stopAllWatch}
            />
          </SidebarInset>
        </SidebarProvider>
      ) : (
        <main className="flex-1 flex flex-col overflow-hidden">
          <WelcomeView
            onConnect={() => setShowConnectionDialog(true)}
            isConnecting={status === "connecting"}
          />
        </main>
      )}

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
