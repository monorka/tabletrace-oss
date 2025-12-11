import { z } from "zod";

// Zod schema - unified for both PostgreSQL and Supabase
export const pgConfigSchema = z.object({
  host: z.string().min(1, "Host is required"),
  port: z.number().min(1).max(65535),
  user: z.string().min(1, "Username is required"),
  password: z.string(),
  database: z.string().min(1, "Database is required"),
  use_ssl: z.boolean(),
});

export type PgConfigForm = z.infer<typeof pgConfigSchema>;

