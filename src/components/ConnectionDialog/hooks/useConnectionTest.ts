import { useState } from "react";
import { useConnectionStore } from "@/stores/connectionStore";
import { PgConfig } from "@/lib/tauri";
import { PgConfigForm } from "../schema";

export function useConnectionTest() {
  const { testConnection } = useConnectionStore();
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null);

  const handleTestConnection = async (values: PgConfigForm) => {
    const config = values as PgConfig;
    
    setTesting(true);
    setTestResult(null);

    const success = await testConnection(config);
    setTestResult(success ? "success" : "error");
    setTesting(false);

    setTimeout(() => setTestResult(null), 3000);
  };

  const resetTestResult = () => {
    setTestResult(null);
  };

  return {
    testing,
    testResult,
    handleTestConnection,
    resetTestResult,
  };
}
