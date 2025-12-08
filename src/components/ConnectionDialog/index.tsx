import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AnimatePresence } from "framer-motion";
import {
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Switch } from "../ui/switch";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "../ui/form";
import { cn } from "../../lib/utils";

type ConnectionTab = "postgres" | "supabase";

interface ConnectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SavedConnection {
  tab: ConnectionTab;
  config: PgConfig;
}

// Zod schemas
const postgresConfigSchema = z.object({
  host: z.string().min(1, "Host is required"),
  port: z.number().min(1).max(65535),
  user: z.string().min(1, "Username is required"),
  password: z.string(),
  database: z.string().min(1, "Database is required"),
  use_ssl: z.boolean().optional().default(false),
});

const supabaseConfigSchema = z.object({
  host: z.string().default("localhost"),
  port: z.number().min(1).max(65535),
  user: z.string().default("postgres"),
  password: z.string().default("postgres"),
  database: z.string().default("postgres"),
  use_ssl: z.boolean().optional().default(false),
});

type PostgresConfigForm = z.infer<typeof postgresConfigSchema>;
type SupabaseConfigForm = z.infer<typeof supabaseConfigSchema>;


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
  const [isLoadedFromStorage, setIsLoadedFromStorage] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null);

  const form = useForm<PostgresConfigForm | SupabaseConfigForm>({
    resolver: zodResolver(
      activeTab === "postgres" ? postgresConfigSchema : supabaseConfigSchema
    ) as any,
    defaultValues: defaultPostgresConfig,
  });

  // Load saved connection on first open
  useEffect(() => {
    if (isOpen && !isLoadedFromStorage) {
      const saved = loadSavedConnection();
      if (saved) {
        setActiveTab(saved.tab);
        // Restore default password for Supabase Local (password is not saved for security)
        const configToLoad = saved.tab === "supabase" && !saved.config.password
          ? { ...saved.config, password: "postgres" }
          : saved.config;
        form.reset(configToLoad);
        setIsLoadedFromStorage(true);
      }
    }
    if (isOpen) {
      setShowPassword(false);
      setTestResult(null);
    }
  }, [isOpen, isLoadedFromStorage, form]);

  // Update form when tab changes
  useEffect(() => {
    const defaultConfig = activeTab === "postgres" 
      ? defaultPostgresConfig 
      : defaultSupabaseLocalConfig;
    form.reset(defaultConfig);
    setTestResult(null);
  }, [activeTab, form]);

  // Update resolver when tab changes
  useEffect(() => {
    form.clearErrors();
  }, [activeTab, form]);

  const handleTabChange = (tab: ConnectionTab) => {
    setActiveTab(tab);
  };

  const handleTestConnection = async () => {
    const values = form.getValues();
    const config = values as PgConfig;
    
    setTesting(true);
    setTestResult(null);

    const success = await testConnection(config);
    setTestResult(success ? "success" : "error");
    setTesting(false);

    setTimeout(() => setTestResult(null), 3000);
  };

  const handleConnect = async (values: PostgresConfigForm | SupabaseConfigForm) => {
    setShowPassword(false);
    const config = values as PgConfig;
    await connect(config);
    if (useConnectionStore.getState().status === "connected") {
      // Save connection on successful connect
      saveConnection({ tab: activeTab, config });
      onClose();
    }
  };

  const config = form.watch() as PgConfig;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className={cn(
          "max-w-md w-full p-0 overflow-hidden",
          "bg-card border-border",
          "min-h-[600px] flex flex-col"
        )}
        showCloseButton={false}
      >
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  activeTab === "postgres" 
                    ? "bg-accent-purple/20" 
                    : "bg-accent-green/20"
                )}
              >
                {activeTab === "postgres" ? (
                  <Database className={cn("w-5 h-5", "text-accent-purple")} />
                ) : (
                  <Zap className={cn("w-5 h-5", "text-accent-green")} />
                )}
              </div>
              <div>
                <DialogTitle className="text-left">Connect to Database</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  {activeTab === "postgres" ? "PostgreSQL" : "Supabase Local"}
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

              {/* Tabs */}
              <div className="flex border-b border-border">
                <button
                  onClick={() => handleTabChange("postgres")}
                  className={cn(
                    "flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2",
                    activeTab === "postgres"
                      ? "text-accent-purple border-b-2 border-accent-purple bg-accent-purple/5"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Database className="w-4 h-4" />
                  <span className="hidden sm:inline">PostgreSQL</span>
                  <span className="sm:hidden">PG</span>
                </button>
                <button
                  onClick={() => handleTabChange("supabase")}
                  className={cn(
                    "flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2",
                    activeTab === "supabase"
                      ? "text-accent-green border-b-2 border-accent-green bg-accent-green/5"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Zap className="w-4 h-4" />
                  <span className="hidden sm:inline">Supabase</span>
                  <span className="sm:hidden">SB</span>
                </button>
              </div>


              {/* Form */}
              <Form {...form}>
                <form id="connection-form" onSubmit={form.handleSubmit(handleConnect)} className="p-4 sm:p-6 space-y-4 flex-1 overflow-y-auto min-h-0">
                  {activeTab === "supabase" ? (
                    <>
                      {/* Port Only */}
                      <FormField
                        control={form.control as any}
                        name="port"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Port</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                value={field.value}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 54322)}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                    {/* Info Box */}
                    <div className="p-3 rounded-lg bg-accent-green/10 border border-accent-green/20">
                      <p className="text-xs text-accent-green font-medium mb-1">
                        Supabase Local (CLI)
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Connects to <span className="font-mono">localhost:{config.port}</span> with default credentials
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1 font-mono opacity-70">
                        user: postgres / password: postgres
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                      {/* PostgreSQL Full Form */}
                      {/* Host & Port */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <FormField
                          control={form.control as any}
                          name="host"
                          render={({ field }) => (
                            <FormItem className="sm:col-span-2">
                              <FormLabel className="text-xs">Host</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control as any}
                          name="port"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Port</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  {...field}
                                  value={field.value}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 5432)}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Database */}
                      <FormField
                        control={form.control as any}
                        name="database"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Database</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      {/* User */}
                      <FormField
                        control={form.control as any}
                        name="user"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Username</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      {/* Password */}
                      <FormField
                        control={form.control as any}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Password</FormLabel>
                            <FormControl>
                              <div className="flex items-center gap-2">
                                <Input
                                  type={showPassword ? "text" : "password"}
                                  {...field}
                                  className="flex-1"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  onClick={() => setShowPassword(!showPassword)}
                                >
                                  {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                </Button>
                              </div>
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      {/* SSL Toggle */}
                      <FormField
                        control={form.control as any}
                        name="use_ssl"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center justify-between p-3 rounded-lg bg-background border border-border">
                              <div className="flex items-center gap-2">
                                <Shield className={cn("w-4 h-4", field.value ? "text-accent-green" : "text-muted-foreground")} />
                                <div>
                                  <FormLabel className="text-sm font-medium cursor-pointer">Use SSL</FormLabel>
                                  <FormDescription className="text-[10px]">
                                    Enable for secure connections
                                  </FormDescription>
                                </div>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </div>
                          </FormItem>
                        )}
                      />

                      {/* SSL Warning for remote connections */}
                      {!config.use_ssl && !['localhost', '127.0.0.1', '::1'].includes(config.host?.toLowerCase() || '') && config.host && (
                        <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-accent-yellow/10 border border-accent-yellow/30">
                          <Shield className="w-4 h-4 text-accent-yellow shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-medium text-accent-yellow">
                              SSL Disabled for Remote Connection
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
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
                    <div
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg text-sm",
                        testResult === "success"
                          ? "bg-accent-green/10 text-accent-green"
                          : "bg-accent-red/10 text-accent-red"
                      )}
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
                    </div>
                  )}
                </AnimatePresence>

                  {/* Error message */}
                  {status === "error" && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-accent-red/10 text-accent-red">
                      <XCircle className="w-4 h-4 shrink-0" />
                      <span className="truncate">
                        {useConnectionStore.getState().errorMessage}
                      </span>
                    </div>
                  )}
                </form>
              </Form>

        {/* Footer */}
        <DialogFooter className="px-4 sm:px-6 py-4 border-t border-border bg-background/50 flex-col sm:flex-row gap-2 sm:justify-between">
          <Button
            type="button"
            onClick={handleTestConnection}
            disabled={testing || status === "connecting" || !config.host || !config.database}
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground w-full sm:w-auto"
          >
            {testing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="ml-2">Testing...</span>
              </>
            ) : (
              "Test Connection"
            )}
          </Button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              type="button"
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground flex-1 sm:flex-initial"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="connection-form"
              disabled={status === "connecting" || !config.host || !config.database}
              size="sm"
              className={cn(
                "text-white flex-1 sm:flex-initial",
                activeTab === "postgres" 
                  ? "bg-accent-purple hover:bg-accent-purple/90" 
                  : "bg-accent-green hover:bg-accent-green/90",
                status === "connecting" || !config.host || !config.database
                  ? "opacity-50"
                  : ""
              )}
            >
              {status === "connecting" ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="ml-2">Connecting...</span>
                </>
              ) : (
                "Connect"
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ConnectionDialog;
