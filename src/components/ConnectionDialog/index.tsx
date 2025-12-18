import { useEffect } from "react";
import { useConnectionStore } from "../../stores/connectionStore";
import { PgConfig } from "../../lib/tauri";
import { Dialog, DialogContent } from "../ui/dialog";
import { Form } from "../ui/form";
import { cn } from "../../lib/utils";
import { ConnectionDialogProps } from "./types";
import { PgConfigForm } from "./schema";
import { saveConnection } from "./connectionStorage";
import { useConnectionForm } from "./hooks/useConnectionForm";
import { useConnectionTest } from "./hooks/useConnectionTest";
import { ConnectionDialogHeader } from "./components/ConnectionDialogHeader";
import { ConnectionTabs } from "./components/ConnectionTabs";
import { PostgresFormFields } from "./components/PostgresFormFields";
import { SupabaseFormFields } from "./components/SupabaseFormFields";
import { TestResultMessage } from "./components/TestResultMessage";
import { ErrorMessage } from "./components/ErrorMessage";
import { ConnectionDialogFooter } from "./components/ConnectionDialogFooter";

export function ConnectionDialog({ isOpen, onClose }: ConnectionDialogProps) {
  const { connect, status } = useConnectionStore();
  const { form, activeTab, handleTabChange } = useConnectionForm(isOpen);
  const { testing, testResult, handleTestConnection, resetTestResult } = useConnectionTest();

  // Reset test result when dialog opens
  useEffect(() => {
    if (isOpen) {
      resetTestResult();
    }
  }, [isOpen, resetTestResult]);

  const handleConnect = async (values: PgConfigForm) => {
    await connect(values);
    if (useConnectionStore.getState().status === "connected") {
      // Save connection on successful connect
      saveConnection({ tab: activeTab, config: values });
      onClose();
    }
  };

  const config = form.watch() as PgConfig;

  const handleTest = async () => {
    const values = form.getValues();
    await handleTestConnection(values);
  };

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
        <ConnectionDialogHeader activeTab={activeTab} />
        <ConnectionTabs activeTab={activeTab} onTabChange={handleTabChange} />

        <Form {...form}>
          <form
            id="connection-form"
            onSubmit={form.handleSubmit(handleConnect)}
            className="p-4 sm:p-6 space-y-4 flex-1 overflow-y-auto min-h-0"
          >
            {activeTab === "supabase" ? (
              <SupabaseFormFields form={form} config={config} />
            ) : (
              <PostgresFormFields form={form} config={config} />
            )}

            <TestResultMessage testResult={testResult} />
            <ErrorMessage />
          </form>
        </Form>

        <ConnectionDialogFooter
          activeTab={activeTab}
          config={config}
          testing={testing}
          status={status}
          onTestConnection={handleTest}
          onClose={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}

export default ConnectionDialog;
