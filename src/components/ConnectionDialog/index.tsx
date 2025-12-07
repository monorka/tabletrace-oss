import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Database,
  Loader2,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Shield,
  Zap,
} from "lucide-react";
import { useConnectionStore } from "../../stores/connectionStore";
import { PgConfig } from "../../lib/tauri";

type ConnectionTab = "postgres" | "supabase";

interface ConnectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SavedConnection {
  tab: ConnectionTab;
  config: PgConfig;
}

// Default configs
const defaultPostgresConfig: PgConfig = {
  host: "localhost",
  port: 5432,
  user: "postgres",
  password: "",
  database: "postgres",
  use_ssl: false,
};

const defaultSupabaseLocalConfig: PgConfig = {
  host: "localhost",
  port: 54322,
  user: "postgres",
  password: "postgres",
  database: "postgres",
  use_ssl: false,
};

// Load/save connection from localStorage
const STORAGE_KEY = "tabletrace-last-connection";

const loadSavedConnection = (): SavedConnection | null => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error("Failed to load saved connection:", e);
  }
  return null;
};

const saveConnection = (connection: SavedConnection) => {
  try {
    // Don't save password for security
    const { password: _, ...configWithoutPassword } = connection.config;
    const safeConnection = {
      ...connection,
      config: { ...configWithoutPassword, password: "" }
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(safeConnection));
  } catch (e) {
    console.error("Failed to save connection:", e);
  }
};

export function ConnectionDialog({ isOpen, onClose }: ConnectionDialogProps) {
  const { connect, testConnection, status } = useConnectionStore();

  const [activeTab, setActiveTab] = useState<ConnectionTab>("postgres");
  const [config, setConfig] = useState<PgConfig>(defaultPostgresConfig);
  const [isLoadedFromStorage, setIsLoadedFromStorage] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null);

  // Load saved connection on first open
  useEffect(() => {
    if (isOpen && !isLoadedFromStorage) {
      const saved = loadSavedConnection();
      if (saved) {
        setActiveTab(saved.tab);
        // Restore default password for Supabase Local (password is not saved for security)
        if (saved.tab === "supabase" && !saved.config.password) {
          setConfig({ ...saved.config, password: "postgres" });
        } else {
          setConfig(saved.config);
        }
        setIsLoadedFromStorage(true);
      }
    }
    if (isOpen) {
      setShowPassword(false);
      setTestResult(null);
    }
  }, [isOpen, isLoadedFromStorage]);

  // Update config when tab changes
  const handleTabChange = (tab: ConnectionTab) => {
    setActiveTab(tab);
    if (tab === "postgres") {
      setConfig(defaultPostgresConfig);
    } else {
      setConfig(defaultSupabaseLocalConfig);
    }
    setTestResult(null);
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);

    const success = await testConnection(config);
    setTestResult(success ? "success" : "error");
    setTesting(false);

    setTimeout(() => setTestResult(null), 3000);
  };

  const handleConnect = async () => {
    setShowPassword(false);
    await connect(config);
    if (useConnectionStore.getState().status === "connected") {
      // Save connection on successful connect
      saveConnection({ tab: activeTab, config });
      onClose();
    }
  };

  const updateConfig = (key: keyof PgConfig, value: string | number | boolean) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const accentColor = activeTab === "postgres" ? "var(--accent-purple)" : "var(--accent-green)";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
          >
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)]">
                <div className="flex items-center gap-3">
                  <div
                    className="p-2 rounded-lg transition-colors"
                    style={{ backgroundColor: `color-mix(in srgb, ${accentColor} 20%, transparent)` }}
                  >
                    {activeTab === "postgres" ? (
                      <Database className="w-5 h-5" style={{ color: accentColor }} />
                    ) : (
                      <Zap className="w-5 h-5" style={{ color: accentColor }} />
                    )}
                  </div>
                  <div>
                    <h2 className="font-semibold">Connect to Database</h2>
                    <p className="text-xs text-[var(--text-secondary)]">
                      {activeTab === "postgres" ? "PostgreSQL" : "Supabase Local"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
                >
                  <X className="w-5 h-5 text-[var(--text-secondary)]" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-[var(--border-color)]">
                <button
                  onClick={() => handleTabChange("postgres")}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                    activeTab === "postgres"
                      ? "text-[var(--accent-purple)] border-b-2 border-[var(--accent-purple)] bg-[var(--accent-purple)]/5"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"
                  }`}
                >
                  <Database className="w-4 h-4" />
                  PostgreSQL
                </button>
                <button
                  onClick={() => handleTabChange("supabase")}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                    activeTab === "supabase"
                      ? "text-[var(--accent-green)] border-b-2 border-[var(--accent-green)] bg-[var(--accent-green)]/5"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"
                  }`}
                >
                  <Zap className="w-4 h-4" />
                  Supabase
                </button>
              </div>


              {/* Form */}
              <div className="p-6 space-y-4">
                {activeTab === "supabase" ? (
                  <>
                    {/* Port Only */}
                    <div>
                      <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                        Port
                      </label>
                      <input
                        type="number"
                        value={config.port}
                        onChange={(e) => updateConfig("port", parseInt(e.target.value) || 54322)}
                        className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg text-sm focus:outline-none transition-colors"
                        onFocus={(e) => e.target.style.borderColor = accentColor}
                        onBlur={(e) => e.target.style.borderColor = ''}
                      />
                    </div>

                    {/* Info Box */}
                    <div className="p-3 rounded-lg bg-[var(--accent-green)]/10 border border-[var(--accent-green)]/20">
                      <p className="text-xs text-[var(--accent-green)] font-medium mb-1">
                        Supabase Local (CLI)
                      </p>
                      <p className="text-[10px] text-[var(--text-secondary)]">
                        Connects to <span className="font-mono">localhost:{config.port}</span> with default credentials
                      </p>
                      <p className="text-[10px] text-[var(--text-secondary)] mt-1 font-mono opacity-70">
                        user: postgres / password: postgres
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    {/* PostgreSQL Full Form */}
                    {/* Host & Port */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                          Host
                        </label>
                        <input
                          type="text"
                          value={config.host}
                          onChange={(e) => updateConfig("host", e.target.value)}
                          className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg text-sm focus:outline-none transition-colors placeholder:text-[var(--text-secondary)]/50"
                          onFocus={(e) => e.target.style.borderColor = accentColor}
                          onBlur={(e) => e.target.style.borderColor = ''}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                          Port
                        </label>
                        <input
                          type="number"
                          value={config.port}
                          onChange={(e) => updateConfig("port", parseInt(e.target.value) || 5432)}
                          className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg text-sm focus:outline-none transition-colors"
                          onFocus={(e) => e.target.style.borderColor = accentColor}
                          onBlur={(e) => e.target.style.borderColor = ''}
                        />
                      </div>
                    </div>

                    {/* Database */}
                    <div>
                      <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                        Database
                      </label>
                      <input
                        type="text"
                        value={config.database}
                        onChange={(e) => updateConfig("database", e.target.value)}
                        className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg text-sm focus:outline-none transition-colors"
                        onFocus={(e) => e.target.style.borderColor = accentColor}
                        onBlur={(e) => e.target.style.borderColor = ''}
                      />
                    </div>

                    {/* User */}
                    <div>
                      <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                        Username
                      </label>
                      <input
                        type="text"
                        value={config.user}
                        onChange={(e) => updateConfig("user", e.target.value)}
                        className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg text-sm focus:outline-none transition-colors"
                        onFocus={(e) => e.target.style.borderColor = accentColor}
                        onBlur={(e) => e.target.style.borderColor = ''}
                      />
                    </div>

                    {/* Password */}
                    <div>
                      <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                        Password
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={config.password}
                          onChange={(e) => updateConfig("password", e.target.value)}
                          className="flex-1 px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg text-sm focus:outline-none transition-colors"
                          onFocus={(e) => e.target.style.borderColor = accentColor}
                          onBlur={(e) => e.target.style.borderColor = ''}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-color)] transition-colors"
                        >
                          {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* SSL Toggle */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)]">
                      <div className="flex items-center gap-2">
                        <Shield className={`w-4 h-4 ${config.use_ssl ? 'text-[var(--accent-green)]' : 'text-[var(--text-secondary)]'}`} />
                        <div>
                          <p className="text-sm font-medium">Use SSL</p>
                          <p className="text-[10px] text-[var(--text-secondary)]">
                            Enable for secure connections
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => updateConfig("use_ssl", !config.use_ssl)}
                        className={`relative w-10 h-5 rounded-full transition-colors ${
                          config.use_ssl ? 'bg-[var(--accent-green)]' : 'bg-[var(--bg-tertiary)]'
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                            config.use_ssl ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* SSL Warning for remote connections */}
                    {!config.use_ssl && !['localhost', '127.0.0.1', '::1'].includes(config.host.toLowerCase()) && config.host && (
                      <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-[var(--accent-yellow)]/10 border border-[var(--accent-yellow)]/30">
                        <Shield className="w-4 h-4 text-[var(--accent-yellow)] flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-[var(--accent-yellow)]">
                            SSL Disabled for Remote Connection
                          </p>
                          <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">
                            Your password and data will be transmitted in plain text. Enable SSL for secure connections to remote servers.
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Test Result */}
                <AnimatePresence>
                  {testResult && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                        testResult === "success"
                          ? "bg-[var(--accent-green)]/10 text-[var(--accent-green)]"
                          : "bg-[var(--accent-red)]/10 text-[var(--accent-red)]"
                      }`}
                    >
                      {testResult === "success" ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          Connection successful
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4" />
                          Connection failed. Check your credentials.
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Error message */}
                {status === "error" && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-[var(--accent-red)]/10 text-[var(--accent-red)]">
                    <XCircle className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">
                      {useConnectionStore.getState().errorMessage}
                    </span>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--border-color)] bg-[var(--bg-primary)]/50">
                <button
                  onClick={handleTestConnection}
                  disabled={testing || status === "connecting" || !config.host || !config.database}
                  className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors disabled:opacity-50"
                >
                  {testing ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Testing...
                    </span>
                  ) : (
                    "Test Connection"
                  )}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConnect}
                    disabled={status === "connecting" || !config.host || !config.database}
                    className="px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                    style={{
                      backgroundColor: accentColor,
                      opacity: status === "connecting" || !config.host || !config.database ? 0.5 : 1
                    }}
                  >
                    {status === "connecting" ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      "Connect"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default ConnectionDialog;
