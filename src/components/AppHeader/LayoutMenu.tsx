import { LayoutGrid, PanelRightOpen, PanelBottomOpen } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { EventLogPosition, LayoutSettings } from "../../types";

interface LayoutMenuProps {
  layoutSettings: LayoutSettings;
  onEventLogPositionChange: (position: EventLogPosition) => void;
}

export function LayoutMenu({
  layoutSettings,
  onEventLogPositionChange,
}: LayoutMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="p-1.5 hover:bg-muted rounded-md transition-colors flex items-center justify-center"
          title="Layout settings"
        >
          <LayoutGrid className="w-4 h-4 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="text-[10px] uppercase">
          Event Log Position
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={layoutSettings.eventLogPosition}
          onValueChange={(value) => onEventLogPositionChange(value as EventLogPosition)}
        >
          <DropdownMenuRadioItem value="right" className="text-xs">
            <PanelRightOpen className="w-4 h-4 mr-2" />
            Right Panel
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="bottom" className="text-xs">
            <PanelBottomOpen className="w-4 h-4 mr-2" />
            Bottom Panel
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

