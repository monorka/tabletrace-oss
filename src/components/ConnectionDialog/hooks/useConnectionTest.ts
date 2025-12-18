import { useState, useCallback } from "react";
import { useConnectionStore } from "@/stores/connectionStore";
import { PgConfig } from "@/lib/tauri";
import { PgConfigForm } from "../schema";

export function useConnectionTest() {
  const { testConnection } = useConnectionStore();
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null);

  const handleTestConnection = useCallback(async (values: PgConfigForm) => {
    console.log('[TestConnection] Starting test with config:', values);
    const config = values as PgConfig;

    setTesting(true);
    setTestResult(null);

    try {
      console.log('[TestConnection] Calling testConnection...');
      const success = await testConnection(config);
      console.log('[TestConnection] Result:', success);
      const newResult = success ? "success" : "error";
      console.log('[TestConnection] Setting testResult to:', newResult);
      setTestResult(newResult);
    } catch (error) {
      console.error('[TestConnection] Error:', error);
      setTestResult("error");
    } finally {
      console.log('[TestConnection] Setting testing to false');
      setTesting(false);
    }

    setTimeout(() => {
      console.log('[TestConnection] Clearing testResult after 3s');
      setTestResult(null);
    }, 3000);
  }, [testConnection]);

  const resetTestResult = useCallback(() => {
    setTestResult(null);
  }, []);

  return {
    testing,
    testResult,
    handleTestConnection,
    resetTestResult,
  };
}
