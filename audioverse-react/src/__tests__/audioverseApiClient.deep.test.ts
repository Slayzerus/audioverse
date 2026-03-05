/**
 * Deep tests for audioverseApiClient interceptors, apiPath, and env resolution.
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// localStorage polyfill (some vitest environments lack it)
if (typeof globalThis.localStorage === 'undefined' || typeof globalThis.localStorage.setItem !== 'function') {
  const _s: Record<string, string> = {};
  (globalThis as any).localStorage = {
    getItem: (k: string) => _s[k] ?? null,
    setItem: (k: string, v: string) => { _s[k] = v; },
    removeItem: (k: string) => { delete _s[k]; },
    clear: () => { for (const k of Object.keys(_s)) delete _s[k]; },
    get length() { return Object.keys(_s).length; },
    key: (i: number) => Object.keys(_s)[i] ?? null,
  };
}

describe('apiPath', () => {
  let apiPath: (moduleBase: string, path: string) => string;

  beforeEach(async () => {
    const mod = await import('../scripts/api/audioverseApiClient');
    apiPath = mod.apiPath;
  });

  it('joins base and path with single slash', () => {
    expect(apiPath('/api/dmx', 'status')).toBe('/api/dmx/status');
  });

  it('strips trailing slash from base', () => {
    expect(apiPath('/api/dmx/', 'status')).toBe('/api/dmx/status');
  });

  it('strips leading slash from path', () => {
    expect(apiPath('/api/dmx', '/status')).toBe('/api/dmx/status');
  });

  it('handles both trailing and leading slash', () => {
    expect(apiPath('/api/dmx/', '/status')).toBe('/api/dmx/status');
  });

  it('handles nested path', () => {
    expect(apiPath('/api/user', '/profiles/1/players')).toBe('/api/user/profiles/1/players');
  });
});

describe('apiClient request interceptor', () => {
  let apiClient: any;

  beforeEach(async () => {
    const mod = await import('../scripts/api/audioverseApiClient');
    apiClient = mod.apiClient;
  });

  it('attaches Bearer token when present in localStorage', async () => {
    localStorage.setItem('audioverse_access_token', 'test-token-123');
    const config = { headers: {} as Record<string, string> };
    // The request interceptor is the first handler
    const handler = (apiClient.interceptors.request as any).handlers[0];
    const result = await handler.fulfilled(config);
    expect(result.headers.Authorization).toBe('Bearer test-token-123');
    localStorage.removeItem('audioverse_access_token');
  });

  it('does not attach Authorization when no token', async () => {
    localStorage.removeItem('audioverse_access_token');
    const config = { headers: {} as Record<string, string> };
    const handler = (apiClient.interceptors.request as any).handlers[0];
    const result = await handler.fulfilled(config);
    expect(result.headers.Authorization).toBeUndefined();
  });

  it('request error handler rejects', async () => {
    const handler = (apiClient.interceptors.request as any).handlers[0];
    const err = new Error('req-error');
    await expect(handler.rejected(err)).rejects.toThrow('req-error');
  });
});

describe('apiClient response interceptor', () => {
  let apiClient: any;

  beforeEach(async () => {
    const mod = await import('../scripts/api/audioverseApiClient');
    apiClient = mod.apiClient;
    // Reset location
    Object.defineProperty(window, 'location', {
      value: { pathname: '/dashboard', href: '' },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    localStorage.removeItem('audioverse_access_token');
    localStorage.removeItem('audioverse_refresh_token');
  });

  const getResponseHandler = () => (apiClient.interceptors.response as any).handlers[0];

  it('passes through successful responses', async () => {
    const handler = getResponseHandler();
    const response = { data: { ok: true }, status: 200 };
    expect(await handler.fulfilled(response)).toBe(response);
  });

  it('handles 401 — clears access token and redirects', async () => {
    localStorage.setItem('audioverse_access_token', 'tok');
    const handler = getResponseHandler();
    const error = {
      config: { url: '/api/test' },
      response: { status: 401 },
    };
    await expect(handler.rejected(error)).rejects.toBe(error);
    expect(localStorage.getItem('audioverse_access_token')).toBeNull();
    // refresh token is httpOnly cookie, not managed via localStorage
  });

  it('skips redirect when already on /login', async () => {
    Object.defineProperty(window, 'location', {
      value: { pathname: '/login', href: '' },
      writable: true,
      configurable: true,
    });
    const handler = getResponseHandler();
    const error = {
      config: { url: '/api/test' },
      response: { status: 401 },
    };
    await expect(handler.rejected(error)).rejects.toBe(error);
    expect(window.location.href).not.toBe('/login');
  });

  it('logs 503 as backend overloaded', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const handler = getResponseHandler();
    const error = {
      config: { url: '/api/heavy' },
      response: { status: 503 },
    };
    await expect(handler.rejected(error)).rejects.toBe(error);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('audioverseApiClient'),
      expect.stringContaining('overloaded'),
      expect.any(String),
    );
    consoleSpy.mockRestore();
  });

  it('rate-limits duplicate error logs', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const handler = getResponseHandler();
    const error = {
      config: { url: '/api/rate-test' },
      response: { status: 401 },
    };
    // First call logs
    await expect(handler.rejected({ ...error })).rejects.toBeDefined();
    const callCount1 = consoleSpy.mock.calls.length;
    // Second immediate call should be rate-limited (same error key within cooldown)
    await expect(handler.rejected({ ...error })).rejects.toBeDefined();
    const callCount2 = consoleSpy.mock.calls.length;
    // Second call should NOT add new log calls (rate-limited)
    expect(callCount2).toBe(callCount1);
    consoleSpy.mockRestore();
  });
});

describe('exported constants', () => {
  it('exports API_ROOT, DMX_BASE, EDITOR_BASE', async () => {
    const mod = await import('../scripts/api/audioverseApiClient');
    expect(mod.API_ROOT).toBeDefined();
    expect(mod.DMX_BASE).toBe('/api/dmx');
    expect(mod.EDITOR_BASE).toBe('/api/editor');
  });
});
