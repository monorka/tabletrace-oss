import { Table2, Clock, GitBranch, FlaskConical } from "lucide-react";
import { SidebarButton } from "./ui";
import { TabType, LayoutSettings } from "../types";

interface AppSidebarProps {
  activeTab: TabType;
  layoutSettings: LayoutSettings;
  onTabChange: (tab: TabType) => void;
  onToggleTableList: () => void;
}

export function AppSidebar({
  activeTab,
  layoutSettings,
  onTabChange,
  onToggleTableList,
}: AppSidebarProps) {
  return (
    <aside className="w-12 border-r border-[var(--border-color)] bg-[var(--bg-secondary)] flex flex-col items-center py-3 gap-2 no-select">
      <SidebarButton
        icon={<Table2 className="w-5 h-5" />}
        active={activeTab === "tables"}
        onClick={() => {
          if (activeTab === "tables") {
            // Toggle table list panel when already on tables tab
            onToggleTableList();
          } else {
            onTabChange("tables");
            // Open table list if closed when switching to tables tab
            if (!layoutSettings.tableListOpen) {
              onToggleTableList();
            }
          }
        }}
        tooltip={layoutSettings.tableListOpen ? "Hide Tables" : "Show Tables"}
        highlight={!layoutSettings.tableListOpen && activeTab === "tables"}
      />
      <SidebarButton
        icon={<Clock className="w-5 h-5" />}
        active={activeTab === "timeline"}
        onClick={() => onTabChange("timeline")}
        tooltip="Timeline"
      />
      <SidebarButton
        icon={<GitBranch className="w-5 h-5" />}
        active={activeTab === "erd"}
        onClick={() => onTabChange("erd")}
        tooltip="ERD Graph"
      />
      <SidebarButton
        icon={<FlaskConical className="w-5 h-5" />}
        active={activeTab === "dryrun"}
        onClick={() => onTabChange("dryrun")}
        tooltip="Dry Run (Preview SQL)"
      />
    </aside>
  );
}

