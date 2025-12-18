import { UseFormReturn } from "react-hook-form";
import { PgConfig } from "@/lib/tauri";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PgConfigForm } from "../schema";

interface SupabaseFormFieldsProps {
  form: UseFormReturn<PgConfigForm>;
  config: PgConfig;
}

export function SupabaseFormFields({ form, config }: SupabaseFormFieldsProps) {
  return (
    <>
      {/* Port Only */}
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
  );
}

