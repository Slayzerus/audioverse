import { vi, describe, it, expect, beforeEach } from 'vitest';
import { navigationLogger } from '../services/navigationLogger';

describe('navigationLogger', () => {
  beforeEach(() => {
    navigationLogger.clearLogs();
  });

  it('info adds a log entry', () => {
    navigationLogger.info('TEST_INFO', { detail: 42 });
    const logs = navigationLogger.getLogs();
    expect(logs).toHaveLength(1);
    expect(logs[0].level).toBe('INFO');
    expect(logs[0].code).toBe('TEST_INFO');
    expect(logs[0].data.detail).toBe(42);
  });

  it('warn adds a log entry and tracks stats', () => {
    navigationLogger.warn('WARN_CODE', { a: 1 });
    const stats = navigationLogger.getStats();
    expect(stats.total).toBe(1);
    expect(stats.warn).toBe(1);
  });

  it('error adds log and tracks stats', () => {
    navigationLogger.error('ERR_CODE', { msg: 'fail' });
    const stats = navigationLogger.getStats();
    expect(stats.error).toBe(1);
  });

  it('getLogsByCode filters correctly', () => {
    navigationLogger.info('A');
    navigationLogger.warn('B');
    navigationLogger.info('A');
    expect(navigationLogger.getLogsByCode('A')).toHaveLength(2);
    expect(navigationLogger.getLogsByCode('B')).toHaveLength(1);
  });

  it('getLogsByLevel filters correctly', () => {
    navigationLogger.info('X');
    navigationLogger.warn('Y');
    navigationLogger.error('Z');
    expect(navigationLogger.getLogsByLevel('INFO')).toHaveLength(1);
    expect(navigationLogger.getLogsByLevel('WARN')).toHaveLength(1);
    expect(navigationLogger.getLogsByLevel('ERROR')).toHaveLength(1);
  });

  it('getRecentLogs returns logs within time window', async () => {
    navigationLogger.info('RECENT');
    const recent = navigationLogger.getRecentLogs(5000);
    expect(recent).toHaveLength(1);
    // Wait 50ms so the log timestamp is in the past
    await new Promise(r => setTimeout(r, 50));
    const old = navigationLogger.getRecentLogs(1); // 1ms window — log is older
    expect(old).toHaveLength(0);
  });

  it('getErrorSummary aggregates and sorts', () => {
    navigationLogger.error('ERR_A');
    navigationLogger.error('ERR_A');
    navigationLogger.warn('WARN_B');
    navigationLogger.error('ERR_A');
    const summary = navigationLogger.getErrorSummary();
    expect(summary[0]).toEqual({ code: 'ERR_A', count: 3 });
    expect(summary[1]).toEqual({ code: 'WARN_B', count: 1 });
  });

  it('exportLogs returns valid JSON with stats', () => {
    navigationLogger.info('EXP');
    const json = navigationLogger.exportLogs();
    const parsed = JSON.parse(json);
    expect(parsed).toHaveProperty('exportedAt');
    expect(parsed).toHaveProperty('stats');
    expect(parsed).toHaveProperty('logs');
    expect(parsed).toHaveProperty('errorSummary');
  });

  it('clearLogs resets logs and stats', () => {
    navigationLogger.info('CLEAR_ME');
    navigationLogger.clearLogs();
    expect(navigationLogger.getLogs()).toHaveLength(0);
    expect(navigationLogger.getStats().total).toBe(0);
  });

  it('resetStats recalculates from existing logs', () => {
    navigationLogger.info('A');
    navigationLogger.warn('B');
    navigationLogger.error('C');
    // stats = 3 total. Now reset stats to recalculate
    navigationLogger.resetStats();
    const stats = navigationLogger.getStats();
    expect(stats.total).toBe(3);
    expect(stats.info).toBe(1);
    expect(stats.warn).toBe(1);
    expect(stats.error).toBe(1);
  });

  it('getFormattedOutput returns string with stats', () => {
    navigationLogger.info('FMT');
    navigationLogger.error('ERR');
    const output = navigationLogger.getFormattedOutput();
    expect(output).toContain('Navigation Logger Report');
    expect(output).toContain('Total: 2');
    expect(output).toContain('ERR');
  });

  it('downloadLogs creates and clicks a link', () => {
    const createObjectURL = vi.fn(() => 'blob:mock');
    const revokeObjectURL = vi.fn();
    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = revokeObjectURL;

    const clickFn = vi.fn();
    const createElementOrig = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = createElementOrig(tag);
      if (tag === 'a') el.click = clickFn;
      return el;
    });

    navigationLogger.downloadLogs();
    expect(createObjectURL).toHaveBeenCalled();
    expect(clickFn).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalled();
  });

  it('printReport runs without error', () => {
    navigationLogger.info('PR');
    expect(() => navigationLogger.printReport()).not.toThrow();
  });

  it('maxLogs is respected (circular buffer)', () => {
    // Add more than 1000 logs
    for (let i = 0; i < 1010; i++) {
      navigationLogger.info(`LOG_${i}`);
    }
    expect(navigationLogger.getLogs().length).toBeLessThanOrEqual(1000);
  });

  it('debug is a no-op in non-dev mode', () => {
    // isDev depends on import.meta.env.MODE
    navigationLogger.debug('DBG', { x: 1 });
    // If not in dev mode, no log added
    if (!navigationLogger.isDev) {
      expect(navigationLogger.getLogsByLevel('DEBUG')).toHaveLength(0);
    }
  });
});
