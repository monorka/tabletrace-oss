import { XCircle } from "lucide-react";
import { useConnectionStore } from "@/stores/connectionStore";

export function ErrorMessage() {
  const errorMessage = useConnectionStore((state) => state.errorMessage);
  const status = useConnectionStore((state) => state.status);

  if (status !== "error" || !errorMessage) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-accent-red/10 text-accent-red">
      <XCircle className="w-4 h-4 shrink-0" />
      <span className="truncate">{errorMessage}</span>
    </div>
  );
}

