/**
 * Navigation Error Logging Service
 * 
 * Monitors spatial navigation system for errors, warnings, and edge cases.
 * Provides debugging tools and error tracking integration.
 */

type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

interface WindowWithAnalytics {
  gtag?: (command: string, event: string, params: Record<string, unknown>) => void;
  Sentry?: { captureException: (error: Error, context?: Record<string, unknown>) => void };
  __navigationLogger?: NavigationLogger;
}

export interface NavigationLogEntry {
  level: LogLevel;
  code: string;
  timestamp: number;
  data: Record<string, unknown>;
  page: string;
  userAgent: string;
}

interface LogStats {
  total: number;
  debug: number;
  info: number;
  warn: number;
  error: number;
}

/**
 * NavigationLogger - Central logging service for navigation system
 * 
 * Usage:
 * import { navigationLogger } from './services/navigationLogger';
 * navigationLogger.warn('DUPLICATE_ID', { id: 'element-1' });
 */
class NavigationLogger {
  private logs: NavigationLogEntry[] = [];
  private readonly maxLogs = 1000;
  private stats: LogStats = { total: 0, debug: 0, info: 0, warn: 0, error: 0 };
  readonly isDev = typeof import.meta !== 'undefined' && import.meta.env?.MODE === 'development';
  private readonly analyticsEndpoint = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_NAV_ANALYTICS_ENDPOINT : undefined;
  private readonly errorEndpoint = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_NAV_ERROR_ENDPOINT : undefined;

  /**
   * Whether remote telemetry is active.
   * Returns true only when at least one endpoint is configured via env vars.
   * When false, logs are stored locally and printed to the console — nothing is sent over the network.
   */
  get telemetryEnabled(): boolean {
    return !!(this.analyticsEndpoint || this.errorEndpoint);
  }
  
  /**
   * Create a log entry
   */
  private createEntry(
    level: LogLevel,
    code: string,
    data?: Record<string, unknown>
  ): NavigationLogEntry {
    return {
      level,
      code,
      timestamp: Date.now(),
      data: data || {},
      page: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
    };
  }

  /**
   * Update statistics
   */
  private updateStats(level: LogLevel) {
    this.stats.total++;
    this.stats[level.toLowerCase() as Lowercase<LogLevel>]++;
  }

  /**
   * Add log entry to internal storage
   */
  private addLog(entry: NavigationLogEntry) {
    this.logs.push(entry);
    
    // Keep only recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
    
    this.updateStats(entry.level);
  }

  /**
   * Debug level logging (development only)
   * Use for detailed navigation flow information
   */
  debug(code: string, data?: Record<string, unknown>) {
    if (!this.isDev) return;
    
    const entry = this.createEntry('DEBUG', code, data);
    
    this.addLog(entry);
  }

  /**
   * Info level logging
   * Use for important navigation events
   */
  info(code: string, data?: Record<string, unknown>) {
    const entry = this.createEntry('INFO', code, data);
    console.info(`[NAV-INFO] ${code}`, data || {});
    this.addLog(entry);
  }

  /**
   * Warning level logging
   * Use for recoverable issues
   */
  warn(code: string, data?: Record<string, unknown>) {
    const entry = this.createEntry('WARN', code, data);
    console.warn(`[NAV-WARN] ${code}`, data || {});
    this.addLog(entry);
    
    // Send to analytics
    this.sendToAnalytics(entry);
  }

  /**
   * Error level logging
   * Use for critical issues that break functionality
   */
  error(code: string, data?: Record<string, unknown>) {
    const entry = this.createEntry('ERROR', code, data);
    console.error(`[NAV-ERROR] ${code}`, data || {});
    this.addLog(entry);
    
    // Send to error tracking service
    this.sendToErrorTracking(entry);
  }

  /**
   * Get all logs
   */
  getLogs(): NavigationLogEntry[] {
    return [...this.logs];
  }

  /**
   * Get logs filtered by code
   */
  getLogsByCode(code: string): NavigationLogEntry[] {
    return this.logs.filter(log => log.code === code);
  }

  /**
   * Get logs filtered by level
   */
  getLogsByLevel(level: LogLevel): NavigationLogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  /**
   * Get logs from last N milliseconds
   */
  getRecentLogs(ms: number): NavigationLogEntry[] {
    const cutoff = Date.now() - ms;
    return this.logs.filter(log => log.timestamp >= cutoff);
  }

  /**
   * Get current statistics
   */
  getStats(): LogStats {
    return { ...this.stats };
  }

  /**
   * Get error summary
   */
  getErrorSummary(): { code: string; count: number }[] {
    const summary: Record<string, number> = {};
    
    this.logs.forEach(log => {
      if (log.level === 'ERROR' || log.level === 'WARN') {
        summary[log.code] = (summary[log.code] || 0) + 1;
      }
    });
    
    return Object.entries(summary)
      .map(([code, count]) => ({ code, count }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Send warning to analytics
   * Integrates with Google Analytics (gtag) and custom analytics endpoint
   */
  private sendToAnalytics(entry: NavigationLogEntry) {
    try {
      // Google Analytics integration
      if (typeof window !== 'undefined' && (window as unknown as WindowWithAnalytics).gtag) {
        (window as unknown as WindowWithAnalytics).gtag!('event', 'navigation_warning', {
          code: entry.code,
          page: entry.page,
          timestamp: entry.timestamp
        });
      }
      
      // Custom analytics endpoint (optional, env-configured)
      if (typeof window !== 'undefined' && navigator.onLine && this.analyticsEndpoint) {
        fetch(this.analyticsEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: entry.code,
            page: entry.page,
            level: entry.level,
            timestamp: entry.timestamp,
            data: entry.data,
            userAgent: navigator.userAgent,
          })
        }).catch(() => { /* silently ignore analytics failures */ });
      }
    } catch (error) {
      console.error('Failed to send analytics:', error);
    }
  }

  /**
   * Send error to error tracking service
   * Integrates with Sentry (if available) and custom error endpoint
   */
  private sendToErrorTracking(entry: NavigationLogEntry) {
    try {
      // Sentry integration
      if (typeof window !== 'undefined' && (window as unknown as WindowWithAnalytics).Sentry) {
        (window as unknown as WindowWithAnalytics).Sentry!.captureException(
          new Error(`[Nav] ${entry.code}: ${JSON.stringify(entry.data)}`),
          { extra: entry.data, tags: { page: entry.page, level: entry.level } }
        );
      }
      
      // Custom error tracking endpoint (optional, env-configured)
      if (typeof window !== 'undefined' && navigator.onLine && this.errorEndpoint) {
        fetch(this.errorEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: entry.code,
            page: entry.page,
            level: entry.level,
            timestamp: entry.timestamp,
            data: entry.data,
            userAgent: navigator.userAgent,
            url: window.location.href,
          })
        }).catch(() => { /* silently ignore error tracking failures */ });
      }
    } catch (error) {
      console.error('Failed to send error tracking:', error);
    }
  }

  /**
   * Export all logs as JSON
   */
  exportLogs(): string {
    return JSON.stringify({
      exportedAt: new Date().toISOString(),
      stats: this.stats,
      logs: this.logs,
      errorSummary: this.getErrorSummary()
    }, null, 2);
  }

  /**
   * Download logs as JSON file
   */
  downloadLogs() {
    const json = this.exportLogs();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `navigation-logs-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Clear all logs
   */
  clearLogs() {
    this.logs = [];
    this.stats = { total: 0, debug: 0, info: 0, warn: 0, error: 0 };
  }

  /**
   * Recalculate stats based on existing logs (without clearing logs)
   */
  resetStats() {
    const next: LogStats = { total: 0, debug: 0, info: 0, warn: 0, error: 0 };
    this.logs.forEach((log) => {
      next.total += 1;
      next[log.level.toLowerCase() as Lowercase<LogLevel>] += 1;
    });
    this.stats = next;
  }

  /**
   * Get formatted console output
   */
  getFormattedOutput(): string {
    let output = '=== Navigation Logger Report ===\n\n';
    
    output += 'Statistics:\n';
    output += `  Total: ${this.stats.total}\n`;
    output += `  Errors: ${this.stats.error}\n`;
    output += `  Warnings: ${this.stats.warn}\n`;
    output += `  Info: ${this.stats.info}\n`;
    output += `  Debug: ${this.stats.debug}\n\n`;
    
    output += 'Recent Errors/Warnings:\n';
    const errors = this.logs
      .filter(l => l.level === 'ERROR' || l.level === 'WARN')
      .slice(-20);
    
    errors.forEach(log => {
      output += `  [${log.level}] ${log.code} at ${new Date(log.timestamp).toLocaleTimeString()}\n`;
    });
    
    output += '\nError Summary:\n';
    this.getErrorSummary().slice(0, 10).forEach(({ code, count }) => {
      output += `  ${code}: ${count}x\n`;
    });
    
    return output;
  }

  /**
   * Print report to console
   */
  printReport() {
  }
}

// Export singleton instance
export const navigationLogger = new NavigationLogger();

// For development convenience, expose on window
if (typeof window !== 'undefined' && navigationLogger.isDev) {
  (window as unknown as WindowWithAnalytics).__navigationLogger = navigationLogger;
}

export type { LogStats };
