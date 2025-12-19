/**
 * TableTrace Configuration
 */

export interface TableTraceConfig {
  // Limits
  limits: {
    /** Maximum rows to display per table */
    maxDisplayRows: number;
    /** Maximum rows for change detection (polling) */
    maxPollingRows: number;
    /** Maximum events to keep in memory */
    maxEvents: number;
    /** Polling interval in milliseconds */
    pollingIntervalMs: number;
  };

  // Version info
  version: {
    /** Current version */
    current: string;
  };
}

/**
 * Default configuration
 */
export const defaultConfig: TableTraceConfig = {
  limits: {
    maxDisplayRows: 1000,
    maxPollingRows: 10000,
    maxEvents: 500,
    pollingIntervalMs: 1000,
  },

  version: {
    current: '0.2.0',
  },
};

/**
 * Current configuration
 */
let currentConfig: TableTraceConfig = { ...defaultConfig };

/**
 * Get current configuration
 */
export function getConfig(): TableTraceConfig {
  return currentConfig;
}

/**
 * Update configuration
 */
export function updateConfig(config: Partial<TableTraceConfig>): void {
  currentConfig = {
    ...currentConfig,
    ...config,
    limits: {
      ...currentConfig.limits,
      ...config.limits,
    },
    version: {
      ...currentConfig.version,
      ...config.version,
    },
  };
}

/**
 * Get a limit value
 */
export function getLimit(limit: keyof TableTraceConfig['limits']): number {
  return currentConfig.limits[limit];
}

// Export config object for direct access
export const config = {
  get: getConfig,
  update: updateConfig,
  getLimit,
};

export default config;
