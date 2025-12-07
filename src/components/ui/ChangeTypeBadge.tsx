/**
 * Change type badge component (INSERT/UPDATE/DELETE)
 */

interface ChangeTypeBadgeProps {
  type: "INSERT" | "UPDATE" | "DELETE";
}

export function ChangeTypeBadge({ type }: ChangeTypeBadgeProps) {
  const config = {
    INSERT: { label: "+", class: "text-[var(--accent-green)] bg-[var(--accent-green)]/10" },
    UPDATE: { label: "~", class: "text-[var(--accent-yellow)] bg-[var(--accent-yellow)]/10" },
    DELETE: { label: "-", class: "text-[var(--accent-red)] bg-[var(--accent-red)]/10" },
  };

  const { label, class: className } = config[type];

  return (
    <span className={`w-4 h-4 rounded text-[10px] flex items-center justify-center font-bold ${className}`}>
      {label}
    </span>
  );
}




