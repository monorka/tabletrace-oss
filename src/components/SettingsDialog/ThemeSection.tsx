/**
 * Theme Selection Section Component
 */

import { Sun, Moon, Monitor, Check } from "lucide-react";
import { Theme } from "../../types";
import { cn } from "../../lib/utils";

interface ThemeSectionProps {
  theme: Theme;
  onChange: (theme: Theme) => void;
}

const themes: { value: Theme; label: string; icon: typeof Sun; description: string }[] = [
  {
    value: "light",
    label: "Light",
    icon: Sun,
    description: "Light theme",
  },
  {
    value: "dark",
    label: "Dark",
    icon: Moon,
    description: "Dark theme",
  },
  {
    value: "system",
    label: "System",
    icon: Monitor,
    description: "Follow system",
  },
];

export function ThemeSection({ theme, onChange }: ThemeSectionProps) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-3">
        Theme
      </label>
      <div className="grid grid-cols-3 gap-2">
        {themes.map((themeOption) => {
          const Icon = themeOption.icon;
          const isSelected = theme === themeOption.value;
          return (
            <button
              key={themeOption.value}
              onClick={() => onChange(themeOption.value)}
              className={cn(
                "relative p-4 rounded-lg border-2 transition-all cursor-pointer",
                "hover:border-accent-purple/50 focus:outline-none focus:ring-2 focus:ring-accent-purple focus:ring-offset-2",
                "shadow-sm hover:shadow-md",
                isSelected
                  ? "border-accent-purple bg-accent-purple/10 shadow-md"
                  : "border-border bg-card hover:bg-accent/50"
              )}
              aria-label={themeOption.description}
            >
              <div className="flex flex-col items-center gap-2.5">
                <div
                  className={cn(
                    "p-2.5 rounded-lg transition-colors",
                    isSelected
                      ? "bg-accent-purple/20 text-accent-purple"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span
                  className={cn(
                    "text-xs font-medium",
                    isSelected ? "text-foreground font-semibold" : "text-muted-foreground"
                  )}
                >
                  {themeOption.label}
                </span>
              </div>
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <div className="w-5 h-5 rounded-full bg-accent-purple flex items-center justify-center shadow-sm">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

