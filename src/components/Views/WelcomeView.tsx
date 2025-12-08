/**
 * Welcome View Component
 */

import { motion } from "framer-motion";
import { Zap, Database, RefreshCw } from "lucide-react";

interface WelcomeViewProps {
  onConnect: () => void;
  isConnecting: boolean;
}

export function WelcomeView({ onConnect, isConnecting }: WelcomeViewProps) {
  return (
    <div className="flex-1 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md px-6"
      >
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[var(--accent-purple)] to-[var(--accent-blue)] flex items-center justify-center">
          <Zap className="w-8 h-8 text-primary" />
        </div>

        <h1 className="text-2xl font-bold mb-2">Welcome to TableTrace</h1>
        <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
          Real-time visualization of database changes across multiple tables.
          Connect to PostgreSQL or Supabase to get started.
        </p>

        <button
          onClick={onConnect}
          disabled={isConnecting}
          className="
            w-full px-4 py-3 rounded-lg font-medium text-sm
            bg-[var(--accent-purple)] hover:bg-[var(--accent-purple)]/80
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200
            flex items-center justify-center gap-2
          "
        >
          {isConnecting ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <Database className="w-4 h-4" />
              Connect to Database
            </>
          )}
        </button>
      </motion.div>
    </div>
  );
}




