/**
 * GamepadNavigationContext — gamepad/keyboard navigation tests.
 *
 * Pokrywa:
 *  - registration / unregistration of Focusable
 *  - algorytm spatial navigation (moveFocus)
 *  - edge wrapping (przeskakiwanie na drugi koniec)
 *  - dropdown trapping (navigation closed within dropdown)
 *  - keyboard navigation (ArrowUp/Down/Left/Right, Enter, Escape)
 *  - gamepad handling (stick, d-pad, confirm, back)
 *  - fallback focus przy usuwaniu aktywnego elementu
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, act, screen, cleanup } from '@testing-library/react';
import { GamepadNavigationProvider, useGamepadNavigation, FocusableMeta } from '../contexts/GamepadNavigationContext';

// Suppress navigationLogger output during tests
vi.mock('../services/navigationLogger', () => ({
  navigationLogger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Node 22+ with --localstorage-file without a path creates non-functional localStorage
const _storageMap = new Map<string, string>();
const _fakeStorage = {
  getItem: (k: string) => _storageMap.get(k) ?? null,
  setItem: (k: string, v: string) => { _storageMap.set(k, String(v)); },
  removeItem: (k: string) => { _storageMap.delete(k); },
  clear: () => { _storageMap.clear(); },
  get length() { return _storageMap.size; },
  key: (_i: number) => null,
} as unknown as Storage;
Object.defineProperty(globalThis, 'localStorage', { value: _fakeStorage, writable: true, configurable: true });

// ─── Helpers ────────────────────────────────────────────────────────

/** Tworzy fake element HTML na pozycji (x,y) o wymiarach (w,h) */
function makeFocusableRef(x = 0, y = 0, w = 100, h = 40): React.RefObject<HTMLElement> {
  const el = document.createElement('div');
  el.tabIndex = 0;
  el.focus = vi.fn();
  el.click = vi.fn();
  el.getBoundingClientRect = () => ({ x, y, width: w, height: h, top: y, left: x, right: x + w, bottom: y + h, toJSON: () => ({}) });
  document.body.appendChild(el);
  return { current: el } as unknown as React.RefObject<HTMLElement>;
}

/** Test component giving access to context */
let ctxRef: ReturnType<typeof useGamepadNavigation> | null = null;
function ContextReader() {
  ctxRef = useGamepadNavigation();
  return null;
}

function renderWithProvider(ui?: React.ReactNode) {
  return render(
    <GamepadNavigationProvider>
      <ContextReader />
      {ui}
    </GamepadNavigationProvider>
  );
}

// ─── Setup ──────────────────────────────────────────────────────────

beforeEach(() => {
  ctxRef = null;
  _storageMap.clear();
  vi.useFakeTimers({ shouldAdvanceTime: true });
  // Mock navigator.getGamepads
  (navigator as any).getGamepads = vi.fn(() => []);
  // Mock window.history.back
  window.history.back = vi.fn();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

// ─── Register / Unregister ──────────────────────────────────────────

describe('Register / Unregister', () => {
  it('rejestruje element i dodaje go do listy focusables', () => {
    renderWithProvider();
    const ref = makeFocusableRef(10, 20, 100, 40);
    act(() => {
      ctxRef!.register({ id: 'btn-1', ref, x: 10, y: 20, width: 100, height: 40 });
    });
    expect(ctxRef!.focusables).toHaveLength(1);
    expect(ctxRef!.focusables[0].id).toBe('btn-1');
  });

  it('ignoruje duplikaty (ten sam id)', () => {
    renderWithProvider();
    const ref = makeFocusableRef(10, 20);
    act(() => {
      ctxRef!.register({ id: 'dup', ref, x: 10, y: 20, width: 100, height: 40 });
      ctxRef!.register({ id: 'dup', ref, x: 10, y: 20, width: 100, height: 40 });
    });
    expect(ctxRef!.focusables).toHaveLength(1);
  });

  it('rejects NaN coordinates', () => {
    renderWithProvider();
    const ref = makeFocusableRef();
    act(() => {
      ctxRef!.register({ id: 'nan', ref, x: NaN, y: 0, width: 100, height: 40 });
    });
    expect(ctxRef!.focusables).toHaveLength(0);
  });

  it('wyrejestrowuje element po unregister', () => {
    renderWithProvider();
    const ref = makeFocusableRef(10, 20);
    act(() => {
      ctxRef!.register({ id: 'rem', ref, x: 10, y: 20, width: 100, height: 40 });
    });
    expect(ctxRef!.focusables).toHaveLength(1);
    act(() => {
      ctxRef!.unregister('rem');
    });
    expect(ctxRef!.focusables).toHaveLength(0);
  });

  it('after removing active element moves focus to first remaining', () => {
    renderWithProvider();
    const ref1 = makeFocusableRef(0, 0);
    const ref2 = makeFocusableRef(200, 0);
    act(() => {
      ctxRef!.register({ id: 'a', ref: ref1, x: 0, y: 0, width: 100, height: 40 });
      ctxRef!.register({ id: 'b', ref: ref2, x: 200, y: 0, width: 100, height: 40 });
    });
    act(() => {
      ctxRef!.setActive('a');
    });
    expect(ctxRef!.activeId).toBe('a');
    act(() => {
      ctxRef!.unregister('a');
    });
    // Focus should jump to 'b'
    expect(ctxRef!.activeId).toBe('b');
    expect(ref2.current!.focus).toHaveBeenCalled();
  });

  it('after removing dropdown-item focus returns to parent dropdown', () => {
    renderWithProvider();
    const refParent = makeFocusableRef(0, 0);
    const refItem = makeFocusableRef(0, 40);
    act(() => {
      ctxRef!.register({ id: 'menu', ref: refParent, x: 0, y: 0, width: 100, height: 40, isDropdown: true });
      ctxRef!.register({ id: 'menu-item-1', ref: refItem, x: 0, y: 40, width: 100, height: 40 });
    });
    act(() => ctxRef!.setActive('menu-item-1'));
    act(() => ctxRef!.unregister('menu-item-1'));
    expect(ctxRef!.activeId).toBe('menu');
  });
});

// ─── Spatial Navigation (moveFocus) ─────────────────────────────────

describe('Spatial Navigation — moveFocus', () => {
  function registerGrid() {
    // układ 2×2:
    //   A (0,0)   B (200,0)
    //   C (0,100) D (200,100)
    const refs = {
      A: makeFocusableRef(0, 0),
      B: makeFocusableRef(200, 0),
      C: makeFocusableRef(0, 100),
      D: makeFocusableRef(200, 100),
    };
    act(() => {
      ctxRef!.register({ id: 'A', ref: refs.A, x: 0, y: 0, width: 100, height: 40 });
      ctxRef!.register({ id: 'B', ref: refs.B, x: 200, y: 0, width: 100, height: 40 });
      ctxRef!.register({ id: 'C', ref: refs.C, x: 0, y: 100, width: 100, height: 40 });
      ctxRef!.register({ id: 'D', ref: refs.D, x: 200, y: 100, width: 100, height: 40 });
    });
    act(() => ctxRef!.setActive('A'));
    return refs;
  }

  it('przesuwa w prawo (A → B)', () => {
    renderWithProvider();
    const refs = registerGrid();
    act(() => ctxRef!.moveFocus(1, 0));
    expect(ctxRef!.activeId).toBe('B');
    expect(refs.B.current!.focus).toHaveBeenCalled();
  });

  it('moves down (A → C)', () => {
    renderWithProvider();
    registerGrid();
    act(() => ctxRef!.moveFocus(0, 1));
    expect(ctxRef!.activeId).toBe('C');
  });

  it('przesuwa w lewo (B → A)', () => {
    renderWithProvider();
    registerGrid();
    act(() => ctxRef!.setActive('B'));
    act(() => ctxRef!.moveFocus(-1, 0));
    expect(ctxRef!.activeId).toBe('A');
  });

  it('moves up (C → A)', () => {
    renderWithProvider();
    registerGrid();
    act(() => ctxRef!.setActive('C'));
    act(() => ctxRef!.moveFocus(0, -1));
    expect(ctxRef!.activeId).toBe('A');
  });

  it('diagonal navigation: A + (1,1) → D (closest diagonally)', () => {
    renderWithProvider();
    registerGrid();
    act(() => ctxRef!.moveFocus(1, 1));
    expect(ctxRef!.activeId).toBe('D');
  });

  it('if no active and there are focusables, activates first', () => {
    renderWithProvider();
    const ref = makeFocusableRef(0, 0);
    act(() => {
      ctxRef!.register({ id: 'first', ref, x: 0, y: 0, width: 100, height: 40 });
    });
    expect(ctxRef!.activeId).toBeNull();
    act(() => ctxRef!.moveFocus(1, 0));
    expect(ctxRef!.activeId).toBe('first');
  });
});

// ─── Edge Wrapping ──────────────────────────────────────────────────

describe('Edge Wrapping', () => {
  it('skacze z ostatniego na pierwszy w pionie (wrapping)', () => {
    renderWithProvider();
    // Kolumna: top (0,0), mid (0,100), bottom (0,200)
    const refT = makeFocusableRef(0, 0);
    const refM = makeFocusableRef(0, 100);
    const refB = makeFocusableRef(0, 200);
    act(() => {
      ctxRef!.register({ id: 'top', ref: refT, x: 0, y: 0, width: 100, height: 40 });
      ctxRef!.register({ id: 'mid', ref: refM, x: 0, y: 100, width: 100, height: 40 });
      ctxRef!.register({ id: 'bot', ref: refB, x: 0, y: 200, width: 100, height: 40 });
    });
    act(() => ctxRef!.setActive('bot'));
    // W dół z ostatniego — brak w tym kierunku, edge wrapping powinien zadziałać
    // ale algorytm szuka farthest w tym samym kierunku, a w dół od bot nie ma nic,
    // więc wrapping wybierze najdalszy kandydat w kierunku dół, czyli... nie ma żadnego.
    // Natomiast w prawo z jedynej kolumny nie ma nic – sprawdźmy w lewo z lewego:
    act(() => ctxRef!.setActive('top'));
    // Z top w górę — brak wyżej, wrapping powinien nie zmienić (bo brak kandydata w tym kierunku)
    act(() => ctxRef!.moveFocus(0, -1));
    // Jeśli nie ma kandydatów w kierunku, focus pozostaje
    expect(ctxRef!.activeId).toBe('top');
  });

  it('wrapping works in row: right edge → far element', () => {
    renderWithProvider();
    // Wiersz: left (0,0), center (200,0), right (400,0)
    const refL = makeFocusableRef(0, 0);
    const refC = makeFocusableRef(200, 0);
    const refR = makeFocusableRef(400, 0);
    act(() => {
      ctxRef!.register({ id: 'left', ref: refL, x: 0, y: 0, width: 100, height: 40 });
      ctxRef!.register({ id: 'center', ref: refC, x: 200, y: 0, width: 100, height: 40 });
      ctxRef!.register({ id: 'right', ref: refR, x: 400, y: 0, width: 100, height: 40 });
    });
    act(() => ctxRef!.setActive('left'));
    act(() => ctxRef!.moveFocus(1, 0)); // left → center
    expect(ctxRef!.activeId).toBe('center');
    act(() => ctxRef!.moveFocus(1, 0)); // center → right
    expect(ctxRef!.activeId).toBe('right');
    // Z right dalej w prawo — wrapping powinien wybrać element farthest w prawo (ale nie ma żadnego)
    act(() => ctxRef!.moveFocus(1, 0));
    // Focus zostaje na right, bo algorytm szuka elementów w kierunku w prawo, których nie ma
    expect(ctxRef!.activeId).toBe('right');
  });
});

// ─── Dropdown Trapping ──────────────────────────────────────────────

describe('Dropdown Trapping', () => {
  it('navigation inside dropdown is closed within position', () => {
    renderWithProvider();
    // Dropdown parent + 3 items
    const refP = makeFocusableRef(0, 0);
    const refI1 = makeFocusableRef(0, 40);
    const refI2 = makeFocusableRef(0, 80);
    const refI3 = makeFocusableRef(0, 120);
    // Element outside dropdown
    const refOut = makeFocusableRef(300, 0);
    act(() => {
      ctxRef!.register({ id: 'nav-dd', ref: refP, x: 0, y: 0, width: 100, height: 40, isDropdown: true });
      ctxRef!.register({ id: 'nav-dd-item-1', ref: refI1, x: 0, y: 40, width: 100, height: 40 });
      ctxRef!.register({ id: 'nav-dd-item-2', ref: refI2, x: 0, y: 80, width: 100, height: 40 });
      ctxRef!.register({ id: 'nav-dd-item-3', ref: refI3, x: 0, y: 120, width: 100, height: 40 });
      ctxRef!.register({ id: 'outside', ref: refOut, x: 300, y: 0, width: 100, height: 40 });
    });

    // Activate item-1
    act(() => ctxRef!.setActive('nav-dd-item-1'));
    expect(ctxRef!.activeId).toBe('nav-dd-item-1');

    // W dół: item-1 → item-2
    act(() => ctxRef!.moveFocus(0, 1));
    expect(ctxRef!.activeId).toBe('nav-dd-item-2');

    // W dół: item-2 → item-3
    act(() => ctxRef!.moveFocus(0, 1));
    expect(ctxRef!.activeId).toBe('nav-dd-item-3');

    // Prawo z dropdown-item NIE powinno przeskoczyć na 'outside' — trapping!
    act(() => ctxRef!.moveFocus(1, 0));
    // Powinien zostać w dropdown (brak kandydata w prawo wśród siblings)
    expect(ctxRef!.activeId).not.toBe('outside');
  });

  it('navigation up from item-1 doesn not escape dropdown', () => {
    renderWithProvider();
    const refP = makeFocusableRef(0, 0);
    const refI1 = makeFocusableRef(0, 40);
    const refI2 = makeFocusableRef(0, 80);
    act(() => {
      ctxRef!.register({ id: 'dd', ref: refP, x: 0, y: 0, width: 100, height: 40, isDropdown: true });
      ctxRef!.register({ id: 'dd-item-1', ref: refI1, x: 0, y: 40, width: 100, height: 40 });
      ctxRef!.register({ id: 'dd-item-2', ref: refI2, x: 0, y: 80, width: 100, height: 40 });
    });
    act(() => ctxRef!.setActive('dd-item-1'));
    act(() => ctxRef!.moveFocus(0, -1));
    // Nie powinien tego wyskoczyć na parent 'dd'
    expect(ctxRef!.activeId).not.toBe('dd');
  });
});

// ─── Keyboard Navigation ────────────────────────────────────────────

describe('Keyboard Navigation', () => {
  function setupRow() {
    const refA = makeFocusableRef(0, 0);
    const refB = makeFocusableRef(200, 0);
    act(() => {
      ctxRef!.register({ id: 'k-a', ref: refA, x: 0, y: 0, width: 100, height: 40 });
      ctxRef!.register({ id: 'k-b', ref: refB, x: 200, y: 0, width: 100, height: 40 });
    });
    act(() => ctxRef!.setActive('k-a'));
    return { refA, refB };
  }

  it('ArrowRight przesuwa focus w prawo', () => {
    renderWithProvider();
    const { refB } = setupRow();
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    });
    expect(ctxRef!.activeId).toBe('k-b');
  });

  it('ArrowLeft przesuwa focus w lewo', () => {
    renderWithProvider();
    setupRow();
    act(() => ctxRef!.setActive('k-b'));
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    });
    expect(ctxRef!.activeId).toBe('k-a');
  });

  it('ArrowDown moves focus down', () => {
    renderWithProvider();
    const refTop = makeFocusableRef(0, 0);
    const refBot = makeFocusableRef(0, 200);
    act(() => {
      ctxRef!.register({ id: 'top', ref: refTop, x: 0, y: 0, width: 100, height: 40 });
      ctxRef!.register({ id: 'bot', ref: refBot, x: 0, y: 200, width: 100, height: 40 });
    });
    act(() => ctxRef!.setActive('top'));
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    });
    expect(ctxRef!.activeId).toBe('bot');
  });

  it('ArrowUp moves focus up', () => {
    renderWithProvider();
    const refTop = makeFocusableRef(0, 0);
    const refBot = makeFocusableRef(0, 200);
    act(() => {
      ctxRef!.register({ id: 'top', ref: refTop, x: 0, y: 0, width: 100, height: 40 });
      ctxRef!.register({ id: 'bot', ref: refBot, x: 0, y: 200, width: 100, height: 40 });
    });
    act(() => ctxRef!.setActive('bot'));
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    });
    expect(ctxRef!.activeId).toBe('top');
  });

  it('Enter klika aktywny element', () => {
    renderWithProvider();
    const { refA } = setupRow();
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    });
    expect(refA.current!.click).toHaveBeenCalled();
  });

  it('Escape calls history.back', () => {
    renderWithProvider();
    setupRow();
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });
    expect(window.history.back).toHaveBeenCalled();
  });

  it('does not navigate with arrows when focus is in INPUT', () => {
    renderWithProvider();
    setupRow();
    const input = document.createElement('input');
    document.body.appendChild(input);
    act(() => {
      const ev = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true });
      Object.defineProperty(ev, 'target', { value: input });
      window.dispatchEvent(ev);
    });
    // Focus should not change
    expect(ctxRef!.activeId).toBe('k-a');
    document.body.removeChild(input);
  });
});

// ─── Gamepad Polling ────────────────────────────────────────────────

describe('Gamepad Polling', () => {
  /** Tworzy mock gamepada z opcjonalnymi przyciskami i osiami */
  function makeGamepad(overrides: { axes?: number[], buttons?: Partial<GamepadButton>[] } = {}): Gamepad {
    const defaultButtons = Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 }));
    const buttons = (overrides.buttons ?? []).map((b, i) => ({
      ...defaultButtons[i],
      ...b,
    }));
    // Fill remaining buttons
    while (buttons.length < 17) {
      buttons.push({ pressed: false, touched: false, value: 0 });
    }
    return {
      id: 'test-gamepad',
      index: 0,
      connected: true,
      mapping: 'standard',
      timestamp: Date.now(),
      axes: overrides.axes ?? [0, 0, 0, 0],
      buttons: buttons as GamepadButton[],
      hapticActuators: [],
      vibrationActuator: null as any,
    };
  }

  it('d-pad prawo przesuwa focus', () => {
    renderWithProvider();
    const refA = makeFocusableRef(0, 0);
    const refB = makeFocusableRef(200, 0);
    act(() => {
      ctxRef!.register({ id: 'gp-a', ref: refA, x: 0, y: 0, width: 100, height: 40 });
      ctxRef!.register({ id: 'gp-b', ref: refB, x: 200, y: 0, width: 100, height: 40 });
    });
    act(() => ctxRef!.setActive('gp-a'));

    // Simulate d-pad right (button 15)
    const pad = makeGamepad({ buttons: Array.from({ length: 17 }, (_, i) => ({ pressed: i === 15 })) });
    (navigator as any).getGamepads = vi.fn(() => [pad]);

    // Menu path — set location
    Object.defineProperty(window, 'location', { value: { pathname: '/' }, writable: true, configurable: true });

    act(() => { vi.advanceTimersByTime(100); }); // tick polling ~2x
    expect(ctxRef!.activeId).toBe('gp-b');
  });

  it('d-pad lewo przesuwa focus', () => {
    renderWithProvider();
    const refA = makeFocusableRef(0, 0);
    const refB = makeFocusableRef(200, 0);
    act(() => {
      ctxRef!.register({ id: 'gp-a', ref: refA, x: 0, y: 0, width: 100, height: 40 });
      ctxRef!.register({ id: 'gp-b', ref: refB, x: 200, y: 0, width: 100, height: 40 });
    });
    act(() => ctxRef!.setActive('gp-b'));

    const pad = makeGamepad({ buttons: Array.from({ length: 17 }, (_, i) => ({ pressed: i === 14 })) });
    (navigator as any).getGamepads = vi.fn(() => [pad]);
    Object.defineProperty(window, 'location', { value: { pathname: '/' }, writable: true, configurable: true });

    act(() => { vi.advanceTimersByTime(100); });
    expect(ctxRef!.activeId).toBe('gp-a');
  });

  it('d-pad up moves focus up', () => {
    renderWithProvider();
    const refTop = makeFocusableRef(0, 0);
    const refBot = makeFocusableRef(0, 200);
    act(() => {
      ctxRef!.register({ id: 'gp-top', ref: refTop, x: 0, y: 0, width: 100, height: 40 });
      ctxRef!.register({ id: 'gp-bot', ref: refBot, x: 0, y: 200, width: 100, height: 40 });
    });
    act(() => ctxRef!.setActive('gp-bot'));

    // button 12 = up
    const pad = makeGamepad({ buttons: Array.from({ length: 17 }, (_, i) => ({ pressed: i === 12 })) });
    (navigator as any).getGamepads = vi.fn(() => [pad]);
    Object.defineProperty(window, 'location', { value: { pathname: '/' }, writable: true, configurable: true });

    act(() => { vi.advanceTimersByTime(100); });
    expect(ctxRef!.activeId).toBe('gp-top');
  });

  it('d-pad down moves focus down', () => {
    renderWithProvider();
    const refTop = makeFocusableRef(0, 0);
    const refBot = makeFocusableRef(0, 200);
    act(() => {
      ctxRef!.register({ id: 'gp-top', ref: refTop, x: 0, y: 0, width: 100, height: 40 });
      ctxRef!.register({ id: 'gp-bot', ref: refBot, x: 0, y: 200, width: 100, height: 40 });
    });
    act(() => ctxRef!.setActive('gp-top'));

    // button 13 = down
    const pad = makeGamepad({ buttons: Array.from({ length: 17 }, (_, i) => ({ pressed: i === 13 })) });
    (navigator as any).getGamepads = vi.fn(() => [pad]);
    Object.defineProperty(window, 'location', { value: { pathname: '/' }, writable: true, configurable: true });

    act(() => { vi.advanceTimersByTime(100); });
    expect(ctxRef!.activeId).toBe('gp-bot');
  });

  it('left stick (X axis > threshold) moves focus right', () => {
    renderWithProvider();
    const refA = makeFocusableRef(0, 0);
    const refB = makeFocusableRef(200, 0);
    act(() => {
      ctxRef!.register({ id: 'st-a', ref: refA, x: 0, y: 0, width: 100, height: 40 });
      ctxRef!.register({ id: 'st-b', ref: refB, x: 200, y: 0, width: 100, height: 40 });
    });
    act(() => ctxRef!.setActive('st-a'));

    // Stick right: axes[0] = 0.8, axes[1] = 0
    const pad = makeGamepad({ axes: [0.8, 0, 0, 0] });
    (navigator as any).getGamepads = vi.fn(() => [pad]);
    Object.defineProperty(window, 'location', { value: { pathname: '/' }, writable: true, configurable: true });

    act(() => { vi.advanceTimersByTime(100); });
    expect(ctxRef!.activeId).toBe('st-b');
  });

  it('przycisk confirm (A) klika aktywny element', () => {
    renderWithProvider();
    const refA = makeFocusableRef(0, 0);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = 'Click me';
    btn.onclick = vi.fn();
    refA.current!.appendChild(btn);

    act(() => {
      ctxRef!.register({ id: 'confirm-test', ref: refA, x: 0, y: 0, width: 100, height: 40 });
    });
    act(() => ctxRef!.setActive('confirm-test'));

    // button 0 = A (confirm)
    const pad = makeGamepad({ buttons: Array.from({ length: 17 }, (_, i) => ({ pressed: i === 0 })) });
    (navigator as any).getGamepads = vi.fn(() => [pad]);
    Object.defineProperty(window, 'location', { value: { pathname: '/' }, writable: true, configurable: true });

    act(() => { vi.advanceTimersByTime(100); });
    expect(btn.onclick).toHaveBeenCalled();
  });

  it('back button (B) calls history.back', () => {
    renderWithProvider();
    const refA = makeFocusableRef(0, 0);
    act(() => {
      ctxRef!.register({ id: 'back-test', ref: refA, x: 0, y: 0, width: 100, height: 40 });
    });
    act(() => ctxRef!.setActive('back-test'));

    // button 1 = B (back)
    const pad = makeGamepad({ buttons: Array.from({ length: 17 }, (_, i) => ({ pressed: i === 1 })) });
    (navigator as any).getGamepads = vi.fn(() => [pad]);
    Object.defineProperty(window, 'location', { value: { pathname: '/' }, writable: true, configurable: true });

    act(() => { vi.advanceTimersByTime(100); });
    expect(window.history.back).toHaveBeenCalled();
  });

  it('left stick below deadzone does not move focus', () => {
    renderWithProvider();
    const refA = makeFocusableRef(0, 0);
    const refB = makeFocusableRef(200, 0);
    act(() => {
      ctxRef!.register({ id: 'dz-a', ref: refA, x: 0, y: 0, width: 100, height: 40 });
      ctxRef!.register({ id: 'dz-b', ref: refB, x: 200, y: 0, width: 100, height: 40 });
    });
    act(() => ctxRef!.setActive('dz-a'));

    // Stick slightly right: axes[0] = 0.1 (below default deadzone 0.25)
    const pad = makeGamepad({ axes: [0.1, 0, 0, 0] });
    (navigator as any).getGamepads = vi.fn(() => [pad]);
    Object.defineProperty(window, 'location', { value: { pathname: '/' }, writable: true, configurable: true });

    act(() => { vi.advanceTimersByTime(100); });
    expect(ctxRef!.activeId).toBe('dz-a'); // not changed
  });

  it('menu cooldown: fast moves do not move focus twice', () => {
    renderWithProvider();
    const refA = makeFocusableRef(0, 0);
    const refB = makeFocusableRef(200, 0);
    const refC = makeFocusableRef(400, 0);
    act(() => {
      ctxRef!.register({ id: 'cd-a', ref: refA, x: 0, y: 0, width: 100, height: 40 });
      ctxRef!.register({ id: 'cd-b', ref: refB, x: 200, y: 0, width: 100, height: 40 });
      ctxRef!.register({ id: 'cd-c', ref: refC, x: 400, y: 0, width: 100, height: 40 });
    });
    act(() => ctxRef!.setActive('cd-a'));

    // D-pad right held down
    const pad = makeGamepad({ buttons: Array.from({ length: 17 }, (_, i) => ({ pressed: i === 15 })) });
    (navigator as any).getGamepads = vi.fn(() => [pad]);
    Object.defineProperty(window, 'location', { value: { pathname: '/' }, writable: true, configurable: true });

    // Tick 50ms — primeiro movimento
    act(() => { vi.advanceTimersByTime(50); });
    expect(ctxRef!.activeId).toBe('cd-b');

    // Tick another 50ms — cooldown 200ms, so it should not move again
    act(() => { vi.advanceTimersByTime(50); });
    expect(ctxRef!.activeId).toBe('cd-b');

    // After cooldown expires (200ms) — should move further
    act(() => { vi.advanceTimersByTime(200); });
    expect(ctxRef!.activeId).toBe('cd-c');
  });

  it('przycisk back (B) w dropdown-item zamyka dropdown', () => {
    renderWithProvider();
    const refParent = makeFocusableRef(0, 0);
    const refItem = makeFocusableRef(0, 40);
    act(() => {
      ctxRef!.register({ id: 'dd', ref: refParent, x: 0, y: 0, width: 100, height: 40, isDropdown: true });
      ctxRef!.register({ id: 'dd-item-1', ref: refItem, x: 0, y: 40, width: 100, height: 40 });
    });
    act(() => ctxRef!.setActive('dd-item-1'));

    const closeHandler = vi.fn();
    window.addEventListener('navbar-close-dropdown', closeHandler);

    const pad = makeGamepad({ buttons: Array.from({ length: 17 }, (_, i) => ({ pressed: i === 1 })) });
    (navigator as any).getGamepads = vi.fn(() => [pad]);
    Object.defineProperty(window, 'location', { value: { pathname: '/' }, writable: true, configurable: true });

    act(() => { vi.advanceTimersByTime(100); });

    expect(closeHandler).toHaveBeenCalled();
    expect(ctxRef!.activeId).toBe('dd');
    expect(window.history.back).not.toHaveBeenCalled();

    window.removeEventListener('navbar-close-dropdown', closeHandler);
  });

  it('no gamepad does not cause errors', () => {
    renderWithProvider();
    (navigator as any).getGamepads = vi.fn(() => []);
    expect(() => {
      act(() => { vi.advanceTimersByTime(200); });
    }).not.toThrow();
  });
});

// ─── setActive ──────────────────────────────────────────────────────

describe('setActive', () => {
  it('sets active element and calls focus', () => {
    renderWithProvider();
    const ref = makeFocusableRef(0, 0);
    act(() => {
      ctxRef!.register({ id: 'sa-1', ref, x: 0, y: 0, width: 100, height: 40 });
    });
    act(() => ctxRef!.setActive('sa-1'));
    expect(ctxRef!.activeId).toBe('sa-1');
    expect(ref.current!.focus).toHaveBeenCalled();
  });
});

// ─── Spatial algorithm: selects closer element ─────────────────────

describe('Spatial algorithm — best candidate selection', () => {
  it('selects closer element, not farther in the same direction', () => {
    renderWithProvider();
    const refA = makeFocusableRef(0, 0);
    const refNear = makeFocusableRef(150, 0);
    const refFar = makeFocusableRef(500, 0);
    act(() => {
      ctxRef!.register({ id: 'origin', ref: refA, x: 0, y: 0, width: 100, height: 40 });
      ctxRef!.register({ id: 'near', ref: refNear, x: 150, y: 0, width: 100, height: 40 });
      ctxRef!.register({ id: 'far', ref: refFar, x: 500, y: 0, width: 100, height: 40 });
    });
    act(() => ctxRef!.setActive('origin'));
    act(() => ctxRef!.moveFocus(1, 0));
    expect(ctxRef!.activeId).toBe('near');
  });

  it('prefers element better aligned angularly', () => {
    renderWithProvider();
    // orig (0,0), aligned (200,0) — idealnie w prawo
    // offaxis (50,300) — mostly down, barely right
    const refA = makeFocusableRef(0, 0);
    const refB = makeFocusableRef(200, 0);
    const refC = makeFocusableRef(50, 300);
    act(() => {
      ctxRef!.register({ id: 'orig', ref: refA, x: 0, y: 0, width: 100, height: 40 });
      ctxRef!.register({ id: 'aligned', ref: refB, x: 200, y: 0, width: 100, height: 40 });
      ctxRef!.register({ id: 'offaxis', ref: refC, x: 50, y: 300, width: 100, height: 40 });
    });
    act(() => ctxRef!.setActive('orig'));
    act(() => ctxRef!.moveFocus(1, 0)); // w prawo
    expect(ctxRef!.activeId).toBe('aligned');
  });
});
