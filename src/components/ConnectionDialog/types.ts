import { PgConfig } from "@/lib/tauri";

export type ConnectionTab = "postgres" | "supabase";

export interface ConnectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface SavedConnection {
  tab: ConnectionTab;
  config: PgConfig;
}

