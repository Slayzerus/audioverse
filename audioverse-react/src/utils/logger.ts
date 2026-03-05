/**
 * General-purpose debug logger with environment-based log levels.
 *
 * Production builds only emit WARN and ERROR.
 * Development builds emit all levels by default (overridable via VITE_LOG_LEVEL).
 *
 * Usage:
 *   import { logger } from '../utils/logger';
 *   logger.debug('KaraokeManager', 'pitch updated', { pitch: 440 });
 *   logger.warn('AudioPitch', 'fallback to default analyser');
 *   logger.error('RSVP', 'mutation failed', error);
 *
 * Scoped loggers:
 *   const log = logger.scoped('KaraokeManager');
 *   log.debug('init');
 *   log.error('failed', error);
 */

type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'NONE';

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 4,
};

function resolveLevel(): LogLevel {
  // Allow explicit override via env var
  const envLevel =
    typeof import.meta !== 'undefined'
      ? (import.meta.env?.VITE_LOG_LEVEL as LogLevel | undefined)
      : undefined;

  if (envLevel && envLevel in LOG_LEVEL_PRIORITY) return envLevel;

  const isDev =
    typeof import.meta !== 'undefined' &&
    import.meta.env?.MODE === 'development';

  return isDev ? 'DEBUG' : 'WARN';
}

const currentLevel = resolveLevel();

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[currentLevel];
}

function formatTag(tag: string): string {
  return `[${tag}]`;
}

export interface ScopedLogger {
  debug: (message: string, ...args: unknown[]) => void;
  info: (message: string, ...args: unknown[]) => void;
  warn: (message: string, ...args: unknown[]) => void;
  error: (message: string, ...args: unknown[]) => void;
}

export const logger = {
  debug(tag: string, message: string, ...args: unknown[]): void {
    if (shouldLog('DEBUG')) {
      // eslint-disable-next-line no-console
      console.debug(formatTag(tag), message, ...args);
    }
  },

  info(tag: string, message: string, ...args: unknown[]): void {
    if (shouldLog('INFO')) {
      // eslint-disable-next-line no-console
      console.info(formatTag(tag), message, ...args);
    }
  },

  warn(tag: string, message: string, ...args: unknown[]): void {
    if (shouldLog('WARN')) {
      // eslint-disable-next-line no-console
      console.warn(formatTag(tag), message, ...args);
    }
  },

  error(tag: string, message: string, ...args: unknown[]): void {
    if (shouldLog('ERROR')) {
      // eslint-disable-next-line no-console
      console.error(formatTag(tag), message, ...args);
    }
  },

  /** Create a logger pre-bound to a specific tag/module name. */
  scoped(tag: string): ScopedLogger {
    return {
      debug: (message: string, ...args: unknown[]) =>
        logger.debug(tag, message, ...args),
      info: (message: string, ...args: unknown[]) =>
        logger.info(tag, message, ...args),
      warn: (message: string, ...args: unknown[]) =>
        logger.warn(tag, message, ...args),
      error: (message: string, ...args: unknown[]) =>
        logger.error(tag, message, ...args),
    };
  },
} as const;

export default logger;
