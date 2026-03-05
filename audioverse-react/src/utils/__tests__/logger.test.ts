import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// We need to test the logger module. Because resolveLevel() runs at module load time,
// we use dynamic imports with vi.resetModules() to test different env configurations.

describe('logger', () => {
  const originalEnv = import.meta.env?.MODE;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    // Restore original env
    if (import.meta.env) {
      import.meta.env.MODE = originalEnv ?? 'test';
      delete import.meta.env.VITE_LOG_LEVEL;
    }
  });

  it('exports logger with all log methods', async () => {
    const { logger } = await import('../logger');
    expect(logger.debug).toBeTypeOf('function');
    expect(logger.info).toBeTypeOf('function');
    expect(logger.warn).toBeTypeOf('function');
    expect(logger.error).toBeTypeOf('function');
    expect(logger.scoped).toBeTypeOf('function');
  });

  it('scoped logger creates bound methods', async () => {
    const { logger } = await import('../logger');
    const scoped = logger.scoped('TestModule');
    expect(scoped.debug).toBeTypeOf('function');
    expect(scoped.info).toBeTypeOf('function');
    expect(scoped.warn).toBeTypeOf('function');
    expect(scoped.error).toBeTypeOf('function');
  });

  it('error() always calls console.error in non-NONE mode', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { logger } = await import('../logger');
    logger.error('Test', 'something broke', { code: 42 });
    expect(spy).toHaveBeenCalledWith('[Test]', 'something broke', { code: 42 });
  });

  it('warn() always calls console.warn in non-NONE mode', async () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { logger } = await import('../logger');
    logger.warn('Test', 'watch out');
    expect(spy).toHaveBeenCalledWith('[Test]', 'watch out');
  });

  it('scoped logger passes tag to underlying methods', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { logger } = await import('../logger');
    const log = logger.scoped('MyModule');
    log.error('test error');
    expect(spy).toHaveBeenCalledWith('[MyModule]', 'test error');
  });
});
