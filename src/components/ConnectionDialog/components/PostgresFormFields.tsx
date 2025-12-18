import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { Eye, EyeOff, Shield } from "lucide-react";
import { PgConfig } from "@/lib/tauri";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { PgConfigForm } from "../schema";
import { cn } from "@/lib/utils";

interface PostgresFormFieldsProps {
  form: UseFormReturn<PgConfigForm>;
  config: PgConfig;
}

export function PostgresFormFields({ form, config }: PostgresFormFieldsProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <>
      {/* Host & Port */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <FormField
          control={form.control}
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
          control={form.control}
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
        control={form.control}
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
        control={form.control}
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
        control={form.control}
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
        control={form.control}
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
  );
}

