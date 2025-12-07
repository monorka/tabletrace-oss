/**
 * Event Correlation Logic
 *
 * Groups related database changes together based on:
 * - Timestamp proximity
 * - Foreign key relationships
 */

import { TableChange } from "./tauri";

/**
 * Correlation method used to group events
 */
export type CorrelationMethod =
  | "timestamp"      // Grouped by time proximity
  | "foreign_key"    // Grouped by FK relationship
  | "transaction"    // Grouped by transaction ID
  | "mixed";         // Multiple methods combined

/**
 * A group of correlated events
 */
export interface CorrelatedEventGroup {
  /** Unique ID for this group */
  id: string;
  /** Events in this group */
  events: TableChange[];
  /** Primary timestamp (earliest event) */
  timestamp: string;
  /** How events were correlated */
  correlationMethod: CorrelationMethod;
  /** Transaction ID if available */
  xid?: number;
  /** Confidence score (0-1) */
  confidence: number;
}

/**
 * Options for correlation
 */
export interface CorrelationOptions {
  /** Time window in milliseconds for timestamp-based grouping */
  windowMs: number;
  /** Whether to use FK relationships for correlation */
  useForeignKeys: boolean;
  /** Minimum events to form a group (single events are not grouped) */
  minGroupSize: number;
}

/**
 * Default correlation options
 */
export const defaultCorrelationOptions: CorrelationOptions = {
  windowMs: 100,        // 100ms window
  useForeignKeys: true,
  minGroupSize: 2,
};

/**
 * Extended TableChange with optional xid
 */
interface TableChangeWithXid extends TableChange {
  xid?: number;
}

/**
 * Correlate events into groups
 */
export function correlateEvents(
  events: TableChange[],
  options: Partial<CorrelationOptions> = {}
): CorrelatedEventGroup[] {
  const opts = { ...defaultCorrelationOptions, ...options };
  const eventsWithXid = events as TableChangeWithXid[];

  // Check if we have transaction IDs
  const hasXid = eventsWithXid.some(e => e.xid !== undefined);

  if (hasXid) {
    // Use transaction ID for accurate grouping
    return correlateByTransactionId(eventsWithXid, opts);
  }

  // Use timestamp-based grouping
  return correlateByTimestamp(eventsWithXid, opts);
}

/**
 * Correlate events by transaction ID
 * Exact grouping - events with same xid are definitely in same transaction
 */
function correlateByTransactionId(
  events: TableChangeWithXid[],
  options: CorrelationOptions
): CorrelatedEventGroup[] {
  const groups: Map<number, TableChangeWithXid[]> = new Map();
  const ungrouped: TableChangeWithXid[] = [];

  // Group by xid
  for (const event of events) {
    if (event.xid !== undefined) {
      const existing = groups.get(event.xid) || [];
      existing.push(event);
      groups.set(event.xid, existing);
    } else {
      ungrouped.push(event);
    }
  }

  const result: CorrelatedEventGroup[] = [];

  // Create groups from xid groupings
  for (const [xid, groupEvents] of groups) {
    if (groupEvents.length >= options.minGroupSize) {
      const sorted = groupEvents.sort((a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      result.push({
        id: `txn-${xid}`,
        events: sorted,
        timestamp: sorted[0].timestamp,
        correlationMethod: "transaction",
        xid,
        confidence: 1.0,  // 100% confidence with xid
      });
    } else {
      ungrouped.push(...groupEvents);
    }
  }

  // Handle ungrouped events with timestamp-based correlation
  if (ungrouped.length > 0) {
    const timestampGroups = correlateByTimestamp(ungrouped, options);
    result.push(...timestampGroups);
  }

  // Sort by timestamp
  return result.sort((a, b) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

/**
 * Correlate events by timestamp proximity (OSS version)
 * Approximate grouping - events within time window are likely related
 */
function correlateByTimestamp(
  events: TableChangeWithXid[],
  options: CorrelationOptions
): CorrelatedEventGroup[] {
  if (events.length === 0) return [];

  // Sort by timestamp
  const sorted = [...events].sort((a, b) =>
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const groups: CorrelatedEventGroup[] = [];
  let currentGroup: TableChangeWithXid[] = [sorted[0]];
  let currentGroupStart = new Date(sorted[0].timestamp).getTime();

  for (let i = 1; i < sorted.length; i++) {
    const event = sorted[i];
    const eventTime = new Date(event.timestamp).getTime();

    // Check if within time window of group start
    if (eventTime - currentGroupStart <= options.windowMs) {
      currentGroup.push(event);
    } else {
      // Finalize current group and start new one
      if (currentGroup.length >= options.minGroupSize) {
        groups.push(createTimestampGroup(currentGroup, options));
      }
      currentGroup = [event];
      currentGroupStart = eventTime;
    }
  }

  // Don't forget the last group
  if (currentGroup.length >= options.minGroupSize) {
    groups.push(createTimestampGroup(currentGroup, options));
  }

  // Sort by timestamp descending (newest first)
  return groups.sort((a, b) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

/**
 * Create a correlation group from timestamp-grouped events
 */
function createTimestampGroup(
  events: TableChangeWithXid[],
  options: CorrelationOptions
): CorrelatedEventGroup {
  const sorted = events.sort((a, b) =>
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // Calculate confidence based on time spread and FK relationships
  let confidence = calculateConfidence(sorted, options);
  let method: CorrelationMethod = "timestamp";

  // Check for FK relationships to boost confidence
  if (options.useForeignKeys && hasRelatedForeignKeys(sorted)) {
    confidence = Math.min(1.0, confidence + 0.2);
    method = "mixed";
  }

  return {
    id: `ts-${sorted[0].timestamp}-${sorted.length}`,
    events: sorted,
    timestamp: sorted[0].timestamp,
    correlationMethod: method,
    confidence,
  };
}

/**
 * Calculate confidence score for timestamp-based grouping
 */
function calculateConfidence(
  events: TableChangeWithXid[],
  options: CorrelationOptions
): number {
  if (events.length < 2) return 0.5;

  const times = events.map(e => new Date(e.timestamp).getTime());
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  const spread = maxTime - minTime;

  // Tighter spread = higher confidence
  // 0ms spread = 0.9 confidence
  // windowMs spread = 0.6 confidence
  const spreadRatio = spread / options.windowMs;
  const confidence = 0.9 - (spreadRatio * 0.3);

  return Math.max(0.5, Math.min(0.9, confidence));
}

/**
 * Check if events have related foreign key values
 * (Simple heuristic: same PK value appears in multiple tables)
 */
function hasRelatedForeignKeys(events: TableChangeWithXid[]): boolean {
  if (events.length < 2) return false;

  // Collect all values from primary_key and after fields
  const valuesByTable: Map<string, Set<string>> = new Map();

  for (const event of events) {
    const tableName = `${event.schema}.${event.table}`;
    const values = new Set<string>();

    // Extract values from primary_key
    if (event.primary_key) {
      for (const val of Object.values(event.primary_key)) {
        if (val !== null && val !== undefined) {
          values.add(String(val));
        }
      }
    }

    // Extract values from after (for INSERT/UPDATE)
    if (event.after) {
      for (const [key, val] of Object.entries(event.after)) {
        // Look for likely FK columns (ending with _id)
        if (key.endsWith("_id") && val !== null && val !== undefined) {
          values.add(String(val));
        }
      }
    }

    valuesByTable.set(tableName, values);
  }

  // Check if any value appears in multiple tables
  const allValues = Array.from(valuesByTable.values());
  for (let i = 0; i < allValues.length; i++) {
    for (let j = i + 1; j < allValues.length; j++) {
      for (const val of allValues[i]) {
        if (allValues[j].has(val)) {
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * Get ungrouped events (events not in any correlation group)
 */
export function getUngroupedEvents(
  events: TableChange[],
  groups: CorrelatedEventGroup[]
): TableChange[] {
  const groupedIds = new Set<string>();
  for (const group of groups) {
    for (const event of group.events) {
      groupedIds.add(event.id);
    }
  }

  return events.filter(e => !groupedIds.has(e.id));
}

/**
 * Format correlation method for display
 */
export function formatCorrelationMethod(method: CorrelationMethod): string {
  switch (method) {
    case "transaction":
      return "Same Transaction";
    case "timestamp":
      return "Time Proximity";
    case "foreign_key":
      return "Related Data";
    case "mixed":
      return "Time + Related";
    default:
      return "Unknown";
  }
}

/**
 * Format confidence score for display
 */
export function formatConfidence(confidence: number): string {
  if (confidence >= 0.9) return "High";
  if (confidence >= 0.7) return "Medium";
  return "Low";
}



