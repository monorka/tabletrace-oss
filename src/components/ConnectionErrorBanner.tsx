import { AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

interface ConnectionErrorBannerProps {
  errorMessage?: string;
  onReconnect: () => void;
}

export function ConnectionErrorBanner({
  errorMessage,
  onReconnect,
}: ConnectionErrorBannerProps) {
  return (
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
          onClick={onReconnect}
          className="px-3 py-1 text-xs font-medium bg-[var(--accent-red)] text-white rounded-md hover:bg-[var(--accent-red)]/80 transition-colors"
        >
          Reconnect
        </button>
      </div>
    </motion.div>
  );
}

