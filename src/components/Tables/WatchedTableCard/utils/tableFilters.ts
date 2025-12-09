/**
 * Table filter utilities
 */

export type FilterOperator = '=' | '!=' | '>' | '<' | '>=' | '<=' | 'contains';

export interface TableFilter {
  column: string;
  value: string;
  operator: FilterOperator;
}

/**
 * Parse filter text into filter objects
 * Supports: col=val, col!=val, col>10, col~text
 */
export function parseFilter(text: string): TableFilter[] {
  if (!text.trim()) return [];

  const filters: TableFilter[] = [];
  const parts = text.split(',').map(p => p.trim()).filter(p => p);

  for (const part of parts) {
    // Try different operators
    let match = part.match(/^(\w+)\s*(!=|>=|<=|>|<|=)\s*(.+)$/);
    if (match) {
      filters.push({
        column: match[1],
        value: match[3].trim(),
        operator: match[2] as FilterOperator
      });
    } else {
      // Try contains (column~value)
      match = part.match(/^(\w+)\s*~\s*(.+)$/);
      if (match) {
        filters.push({ column: match[1], value: match[2].trim(), operator: 'contains' });
      }
    }
  }
  return filters;
}

/**
 * Check if a row matches the given filters
 */
export function matchesFilter(row: Record<string, unknown>, filters: TableFilter[]): boolean {
  if (filters.length === 0) return true;

  return filters.every(filter => {
    const cellValue = row[filter.column];
    if (cellValue === undefined) return false;

    const cellStr = String(cellValue).toLowerCase();
    const filterVal = filter.value.toLowerCase();

    switch (filter.operator) {
      case '=':
        return cellStr === filterVal || String(cellValue) === filter.value;
      case '!=':
        return cellStr !== filterVal && String(cellValue) !== filter.value;
      case '>':
        return Number(cellValue) > Number(filter.value);
      case '<':
        return Number(cellValue) < Number(filter.value);
      case '>=':
        return Number(cellValue) >= Number(filter.value);
      case '<=':
        return Number(cellValue) <= Number(filter.value);
      case 'contains':
        return cellStr.includes(filterVal);
      default:
        return true;
    }
  });
}

