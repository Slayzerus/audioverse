import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiClient, apiPath } from '../scripts/api/audioverseApiClient';

describe('audioverseApiClient', () => {
  let origLocalStorage: any;
  let origLocation: any;

  beforeEach(() => {
    origLocalStorage = (global as any).localStorage;
    origLocation = (global as any).window?.location || (global as any).location;
    (global as any).localStorage = {
      getItem: vi.fn(),
      removeItem: vi.fn(),
    } as any;
    // ensure window.location exists and is mutable for tests
    (global as any).window = (global as any).window || {};
    (global as any).window.location = { pathname: '/', href: '/' } as any;
  });

  afterEach(() => {
    (global as any).localStorage = origLocalStorage;
    (global as any).window.location = origLocation;
    vi.restoreAllMocks();
  });

  it('apiPath joins paths correctly', () => {
    expect(apiPath('/api/base', '/sub')).toBe('/api/base/sub');
    expect(apiPath('/api/base/', 'sub')).toBe('/api/base/sub');
    expect(apiPath('/api/base', '')).toBe('/api/base/');
  });

  it('request interceptor adds Authorization header when token present', async () => {
    (global as any).localStorage.getItem = vi.fn().mockReturnValue('tok123');
    const handlers = (apiClient as any).interceptors.request.handlers;
    expect(Array.isArray(handlers)).toBeTruthy();
    const reqHandler = handlers.find((h: any) => typeof h.fulfilled === 'function');
    expect(reqHandler).toBeTruthy();

    const cfg: any = { headers: {} };
    const result = await reqHandler.fulfilled(cfg);
    expect(result.headers.Authorization).toBe('Bearer tok123');
  });

  it('request interceptor leaves headers alone when no token', async () => {
    (global as any).localStorage.getItem = vi.fn().mockReturnValue(null);
    const handlers = (apiClient as any).interceptors.request.handlers;
    const reqHandler = handlers.find((h: any) => typeof h.fulfilled === 'function');
    const cfg: any = { headers: {} };
    const result = await reqHandler.fulfilled(cfg);
    expect(result.headers.Authorization).toBeUndefined();
  });

  it('response interceptor handles 401 by removing tokens and redirecting', async () => {
    const respHandlers = (apiClient as any).interceptors.response.handlers;
    const errHandler = respHandlers.find((h: any) => typeof h.rejected === 'function');
    expect(errHandler).toBeTruthy();

    const fakeError: any = {
      config: { url: '/x' },
      response: { status: 401 },
    };
    (global as any).localStorage.removeItem = vi.fn();
    (global as any).window.location.pathname = '/not-login';

    await expect(errHandler.rejected(fakeError)).rejects.toBeTruthy();
    expect((global as any).localStorage.removeItem).toHaveBeenCalledWith('audioverse_access_token');
    expect((global as any).window.location.href).toBe('/login');
  });

  it('response interceptor logs on insufficient resources', async () => {
    const respHandlers = (apiClient as any).interceptors.response.handlers;
    const errHandler = respHandlers.find((h: any) => typeof h.rejected === 'function');
    const spyErr = vi.spyOn(console, 'error').mockImplementation(() => {});

    const fakeError: any = {
      config: { url: '/y' },
      code: 'ERR_INSUFFICIENT_RESOURCES',
      response: { status: 503 },
    };
    await expect(errHandler.rejected(fakeError)).rejects.toBeTruthy();
    expect(spyErr).toHaveBeenCalled();
    spyErr.mockRestore();
  });
});
