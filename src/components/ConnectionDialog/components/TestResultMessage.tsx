import { AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "../../../lib/utils";

interface TestResultMessageProps {
  testResult: "success" | "error" | null;
}

export function TestResultMessage({ testResult }: TestResultMessageProps) {
  return (
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
  );
}

