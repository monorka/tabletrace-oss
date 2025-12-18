import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ConnectionTab } from "../types";
import { PgConfigForm, pgConfigSchema } from "../schema";
import { defaultPostgresConfig, defaultSupabaseLocalConfig } from "../defaults";
import { loadSavedConnection } from "../connectionStorage";

export function useConnectionForm(isOpen: boolean) {
  const [activeTab, setActiveTab] = useState<ConnectionTab>("postgres");
  const [isLoadedFromStorage, setIsLoadedFromStorage] = useState(false);

  const form = useForm<PgConfigForm>({
    resolver: zodResolver(pgConfigSchema),
    defaultValues: defaultPostgresConfig,
  });

  // Reset isLoadedFromStorage when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setIsLoadedFromStorage(false);
    }
  }, [isOpen]);

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
  }, [isOpen, isLoadedFromStorage, form]);

  // Update form when tab changes
  useEffect(() => {
    const defaultConfig = activeTab === "postgres" 
      ? defaultPostgresConfig 
      : defaultSupabaseLocalConfig;
    form.reset(defaultConfig);
  }, [activeTab, form]);

  // Update resolver when tab changes
  useEffect(() => {
    form.clearErrors();
  }, [activeTab, form]);

  const handleTabChange = (tab: ConnectionTab) => {
    setActiveTab(tab);
  };

  return {
    form,
    activeTab,
    handleTabChange,
  };
}

