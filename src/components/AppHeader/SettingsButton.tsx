import { Settings } from "lucide-react";

interface SettingsButtonProps {
  onSettingsOpen: () => void;
}

export function SettingsButton({ onSettingsOpen }: SettingsButtonProps) {
  return (
    <button
      onClick={onSettingsOpen}
      className="p-1.5 mr-2 hover:bg-muted rounded-md transition-colors flex items-center justify-center"
      title="Settings"
    >
      <Settings className="w-4 h-4 text-muted-foreground" />
    </button>
  );
}

