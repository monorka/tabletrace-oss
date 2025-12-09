import * as React from "react";
import { Table2, Clock, GitBranch, FlaskConical} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "./ui/sidebar";
import { TabType, LayoutSettings } from "../types";

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  activeTab: TabType;
  layoutSettings: LayoutSettings;
  onTabChange: (tab: TabType) => void;
  onToggleTableList: () => void;
}

const navItems = [
  {
    title: "Tables",
    icon: Table2,
    tab: "tables" as TabType,
  },
  {
    title: "Timeline",
    icon: Clock,
    tab: "timeline" as TabType,
  },
  {
    title: "ERD Graph",
    icon: GitBranch,
    tab: "erd" as TabType,
  },
  {
    title: "Dry Run (Preview SQL)",
    icon: FlaskConical,
    tab: "dryrun" as TabType,
  },
];

export function AppSidebar({
  activeTab,
  layoutSettings,
  onTabChange,
  onToggleTableList,
  ...props
}: AppSidebarProps) {
  return (
    <Sidebar
      collapsible="none"
      className="w-[calc(var(--sidebar-width-icon)+1px)]! border-r"
      {...props}
    >
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent className="px-1.5 md:px-0">
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = activeTab === item.tab;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      tooltip={{
                        children: item.title,
                        hidden: false,
                      }}
                      onClick={() => {
                        if (item.tab === "tables") {
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
                        } else {
                          onTabChange(item.tab);
                        }
                      }}
                      isActive={isActive}
                      className={cn(
                        "px-2.5 md:px-2",
                        isActive
                          ? "bg-accent-purple/20 text-accent-purple hover:bg-accent-purple/30 data-[active=true]:bg-accent-purple/20 data-[active=true]:text-accent-purple"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      )}
                    >
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

