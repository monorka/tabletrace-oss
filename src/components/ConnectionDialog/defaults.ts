import { PgConfig } from "@/lib/tauri";

export const defaultPostgresConfig: PgConfig = {
  host: "localhost",
  port: 5432,
  user: "postgres",
  password: "",
  database: "postgres",
  use_ssl: false,
};

export const defaultSupabaseLocalConfig: PgConfig = {
  host: "localhost",
  port: 54322,
  user: "postgres",
  password: "postgres",
  database: "postgres",
  use_ssl: false,
};

