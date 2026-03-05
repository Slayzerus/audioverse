/**
 * Supplementary tests for navigationLogger covering gtag analytics,
 * error tracking catch paths, and formatted output with errors/warnings.
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// We need a fresh NavigationLogger class, not the singleton
const getNavigationLoggerClass = async () => {
  // Import the module and create a fresh instance via the class
  // Since NavigationLogger class is not exported, we use the singleton and clearLogs
  const { navigationLogger } = await import('../services/navigationLogger');
  return navigationLogger;
};

describe('navigationLogger supplementary', () => {
  let logger: any;

  beforeEach(async () => {
    logger = await getNavigationLoggerClass();
    logger.clearLogs();
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete (window as any).gtag;
  });

  it('sendToAnalytics calls window.gtag when present', () => {
    const gtagFn = vi.fn();
    (window as any).gtag = gtagFn;
    logger.warn('TEST_WARN', { extra: 1 });
    expect(gtagFn).toHaveBeenCalledWith(
      'event',
      'navigation_warning',
      expect.objectContaining({ code: 'TEST_WARN' }),
    );
  });

  it('sendToAnalytics handles gtag throwing', () => {
    (window as any).gtag = () => { throw new Error('gtag broken'); };
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    // Should not throw:
    expect(() => logger.warn('BROKEN_GTAG')).not.toThrow();
    expect(errorSpy).toHaveBeenCalledWith(
      'Failed to send analytics:',
      expect.any(Error),
    );
  });

  it('sendToAnalytics no-ops when gtag absent', () => {
    delete (window as any).gtag;
    expect(() => logger.warn('NO_GTAG')).not.toThrow();
  });

  it('error calls sendToErrorTracking without crash', () => {
    expect(() => logger.error('ERR_TEST', { key: 'val' })).not.toThrow();
  });

  it('getFormattedOutput includes error/warn entries', () => {
    logger.warn('W1', {});
    logger.error('E1', {});
    logger.warn('W1', {});
    logger.info('I1', {});
    const output = logger.getFormattedOutput();
    expect(output).toContain('=== Navigation Logger Report ===');
    expect(output).toContain('[WARN] W1');
    expect(output).toContain('[ERROR] E1');
    expect(output).toContain('W1: 2x');
    expect(output).toContain('E1: 1x');
  });

  it('getFormattedOutput with empty logs', () => {
    const output = logger.getFormattedOutput();
    expect(output).toContain('Total: 0');
    expect(output).toContain('Errors: 0');
  });

  it('resetStats recalculates from mixed logs', () => {
    logger.info('A');
    logger.warn('B');
    logger.error('C');
    logger.info('D');
    // Manually corrupt stats to verify resetStats fixes them
    (logger as any).stats.total = 999;
    logger.resetStats();
    const stats = logger.getStats();
    expect(stats.total).toBe(4);
    expect(stats.info).toBe(2);
    expect(stats.warn).toBe(1);
    expect(stats.error).toBe(1);
  });

  it('exportLogs returns JSON with errorSummary', () => {
    logger.warn('W1');
    logger.error('E1');
    const json = logger.exportLogs();
    const parsed = JSON.parse(json);
    expect(parsed.exportedAt).toBeDefined();
    expect(parsed.logs.length).toBe(2);
    expect(parsed.errorSummary.length).toBeGreaterThanOrEqual(1);
    expect(parsed.stats.total).toBe(2);
  });

  it('downloadLogs creates blob URL and clicks link', () => {
    const mockClick = vi.fn();
    const mockCreateElement = vi.spyOn(document, 'createElement').mockReturnValue({
      href: '',
      download: '',
      click: mockClick,
    } as any);
    const mockCreateObjectURL = vi.fn(() => 'blob:test');
    const mockRevokeObjectURL = vi.fn();
    globalThis.URL.createObjectURL = mockCreateObjectURL;
    globalThis.URL.revokeObjectURL = mockRevokeObjectURL;

    logger.info('LOG');
    logger.downloadLogs();

    expect(mockCreateObjectURL).toHaveBeenCalled();
    expect(mockClick).toHaveBeenCalled();
    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:test');
    mockCreateElement.mockRestore();
  });

  it('printReport does not throw', () => {
    logger.warn('X');
    expect(() => logger.printReport()).not.toThrow();
  });

  it('maxLogs trims old entries', () => {
    for (let i = 0; i < 1005; i++) {
      logger.info(`LOG_${i}`);
    }
    const logs = logger.getLogs();
    expect(logs.length).toBeLessThanOrEqual(1000);
  });
});
