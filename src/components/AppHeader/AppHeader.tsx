import { AppTitle } from "./AppTitle";
import { ConnectionStatus } from "./ConnectionStatus";
import { ConnectionButton } from "./ConnectionButton";
import { LayoutMenu } from "./LayoutMenu";
import { SettingsButton } from "./SettingsButton";
import { EventLogPosition, LayoutSettings } from "../../types";
import { ConnectionStatus as ConnectionStatusType } from "../../stores/connectionStore";

interface AppHeaderProps {
  status: ConnectionStatusType;
  config?: { user: string; host: string; port: number; database: string };
  layoutSettings: LayoutSettings;
  onConnect: () => void;
  onDisconnect: () => void;
  onEventLogPositionChange: (position: EventLogPosition) => void;
  onSettingsOpen: () => void;
}

export function AppHeader({
  status,
  config,
  layoutSettings,
  onConnect,
  onDisconnect,
  onEventLogPositionChange,
  onSettingsOpen,
}: AppHeaderProps) {
  return (
    <header className="h-12 border-b border-border flex items-center justify-between px-4 bg-card no-select">
      <AppTitle />

      <div className="flex items-center gap-4">
        <ConnectionStatus status={status} config={config} />
        <ConnectionButton
          status={status}
          onConnect={onConnect}
          onDisconnect={onDisconnect}
        />
        <LayoutMenu
          layoutSettings={layoutSettings}
          onEventLogPositionChange={onEventLogPositionChange}
        />
        <SettingsButton onSettingsOpen={onSettingsOpen} />
      </div>
    </header>
  );
}

