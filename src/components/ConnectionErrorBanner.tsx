import { AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "./ui/button";

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
      className="bg-accent-red/10 border-b border-accent-red/30 overflow-hidden"
    >
      <div className="px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-accent-red" />
          <span className="text-sm text-accent-red">
            {errorMessage || "Connection lost"}
          </span>
        </div>
        <Button
          onClick={onReconnect}
          variant="destructive"
          size="sm"
        >
          Reconnect
        </Button>
      </div>
    </motion.div>
  );
}

