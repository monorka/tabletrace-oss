/**
 * Primary key utilities for table row identification
 */

/**
 * Get effective primary key columns (supports composite keys)
 * Falls back to first column if no PK exists
 */
export function getEffectivePkColumns(columns: Array<{ name: string; is_primary_key?: boolean }>): string[] {
  const pkColumns = columns?.filter(c => c.is_primary_key).map(c => c.name) || [];
  return pkColumns.length > 0 ? pkColumns : (columns?.[0]?.name ? [columns[0].name] : []);
}

/**
 * Generate PK string (matches Rust's format: pk1::pk2::pk3)
 */
export function generatePk(
  rowData: Record<string, unknown> | undefined | null,
  effectivePkColumns: string[]
): string {
  if (!rowData || effectivePkColumns.length === 0) return '';
  try {
    return effectivePkColumns
      .map(col => String(rowData[col] ?? ''))
      .join('::');
  } catch {
    return '';
  }
}

