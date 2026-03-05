/**
 * gamepadMapping — testy load/save/defaults/walidacji.
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadGamepadMapping, saveGamepadMapping, defaultGamepadMapping } from '../utils/gamepadMapping';

// Node 22+ with --localstorage-file without a path creates non-functional localStorage — override it
let storageMap = new Map<string, string>();
const fakeStorage = {
  getItem: (k: string) => storageMap.get(k) ?? null,
  setItem: (k: string, v: string) => { storageMap.set(k, String(v)); },
  removeItem: (k: string) => { storageMap.delete(k); },
  clear: () => { storageMap.clear(); },
  get length() { return storageMap.size; },
  key: (_i: number) => null,
} as unknown as Storage;
Object.defineProperty(globalThis, 'localStorage', { value: fakeStorage, writable: true, configurable: true });

beforeEach(() => {
  storageMap = new Map();
});

describe('loadGamepadMapping', () => {
  it('returns default values when localStorage is empty', () => {
    const m = loadGamepadMapping();
    expect(m).toEqual(defaultGamepadMapping);
    expect(m.confirmButton).toBe(0);
    expect(m.backButton).toBe(1);
    expect(m.deadzone).toBe(0.25);
  });

  it('parsuje poprawny JSON z localStorage', () => {
    localStorage.setItem('gamepadMapping', JSON.stringify({ confirmButton: 2, backButton: 3, deadzone: 0.5 }));
    const m = loadGamepadMapping();
    expect(m.confirmButton).toBe(2);
    expect(m.backButton).toBe(3);
    expect(m.deadzone).toBe(0.5);
  });

  it('clampuje deadzone do [0,1]', () => {
    localStorage.setItem('gamepadMapping', JSON.stringify({ confirmButton: 0, backButton: 1, deadzone: 5 }));
    const m = loadGamepadMapping();
    expect(m.deadzone).toBe(1);
  });

  it('clampuje deadzone ujemny do 0', () => {
    localStorage.setItem('gamepadMapping', JSON.stringify({ confirmButton: 0, backButton: 1, deadzone: -3 }));
    const m = loadGamepadMapping();
    expect(m.deadzone).toBe(0);
  });

  it('uses defaults when fields have wrong type', () => {
    localStorage.setItem('gamepadMapping', JSON.stringify({ confirmButton: 'x', backButton: true, deadzone: 'nope' }));
    const m = loadGamepadMapping();
    expect(m).toEqual(defaultGamepadMapping);
  });

  it('returns defaults for invalid JSON', () => {
    localStorage.setItem('gamepadMapping', 'not json at all');
    const m = loadGamepadMapping();
    expect(m).toEqual(defaultGamepadMapping);
  });

  it('fills missing fields with defaults', () => {
    localStorage.setItem('gamepadMapping', JSON.stringify({ confirmButton: 5 }));
    const m = loadGamepadMapping();
    expect(m.confirmButton).toBe(5);
    expect(m.backButton).toBe(defaultGamepadMapping.backButton);
    expect(m.deadzone).toBe(defaultGamepadMapping.deadzone);
  });
});

describe('saveGamepadMapping', () => {
  it('zapisuje do localStorage i zwraca znormalizowany mapping', () => {
    const result = saveGamepadMapping({ confirmButton: 3, backButton: 2, deadzone: 0.4 });
    expect(result).toEqual({ confirmButton: 3, backButton: 2, deadzone: 0.4 });
    const stored = JSON.parse(localStorage.getItem('gamepadMapping')!);
    expect(stored).toEqual({ confirmButton: 3, backButton: 2, deadzone: 0.4 });
  });

  it('clampuje deadzone przy zapisie', () => {
    const result = saveGamepadMapping({ confirmButton: 0, backButton: 1, deadzone: 2.5 });
    expect(result.deadzone).toBe(1);
  });

  it('dispatchuje event gamepadMappingChanged', () => {
    const handler = vi.fn();
    window.addEventListener('gamepadMappingChanged', handler);
    saveGamepadMapping({ confirmButton: 0, backButton: 1, deadzone: 0.3 });
    expect(handler).toHaveBeenCalledTimes(1);
    const detail = (handler.mock.calls[0][0] as CustomEvent).detail;
    expect(detail.deadzone).toBe(0.3);
    window.removeEventListener('gamepadMappingChanged', handler);
  });

  it('reload reads saved values', () => {
    saveGamepadMapping({ confirmButton: 7, backButton: 8, deadzone: 0.1 });
    const loaded = loadGamepadMapping();
    expect(loaded.confirmButton).toBe(7);
    expect(loaded.backButton).toBe(8);
    expect(loaded.deadzone).toBe(0.1);
  });
});
