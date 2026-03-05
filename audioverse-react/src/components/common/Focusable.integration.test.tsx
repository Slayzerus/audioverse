/**
 * Focusable — testy integracyjne z GamepadNavigationContext.
 *
 * Pokrywa:
 *  - rejestrację i wyrejestrowanie przy mount/unmount
 *  - nadawanie klasy .focusable-active
 *  - aria-label domyślny i niestandardowy
 *  - atrybut tabIndex
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { useState } from 'react';
import { render, act, screen, cleanup } from '@testing-library/react';
import { GamepadNavigationProvider, useGamepadNavigation } from '../../contexts/GamepadNavigationContext';
import { Focusable } from './Focusable';

// Mock navigationLogger
vi.mock('../../services/navigationLogger', () => ({
  navigationLogger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// Mock useFocusableLayout to return stable, controllable positions
let layoutValues: Record<string, { x: number; y: number; width: number; height: number }> = {};
vi.mock('./useFocusableLayout', () => ({
  useFocusableLayout: () => {
    const ref = React.useRef<HTMLDivElement>(null);
    // Use a per-id layout or default
    const id = (ref as any)._focusId;
    const layout = layoutValues[id ?? ''] ?? { x: 0, y: 0, width: 100, height: 40 };
    return { ref, layout };
  },
}));

beforeEach(() => {
  layoutValues = {};
  (navigator as any).getGamepads = vi.fn(() => []);
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

/** Test component exposing setActive */
let setActiveFn: ((id: string) => void) | null = null;
let activeIdValue: string | null = null;
let focusablesList: any[] = [];
function Inspector() {
  const ctx = useGamepadNavigation();
  setActiveFn = ctx.setActive;
  activeIdValue = ctx.activeId;
  focusablesList = ctx.focusables;
  return null;
}

describe('Focusable — integracja', () => {
  it('registers in context after mount', () => {
    render(
      <GamepadNavigationProvider>
        <Inspector />
        <Focusable id="btn-ok">OK</Focusable>
      </GamepadNavigationProvider>
    );
    expect(focusablesList.some(f => f.id === 'btn-ok')).toBe(true);
  });

  it('unregisters after unmount', () => {
    function Toggle() {
      const [show, setShow] = useState(true);
      return (
        <>
          <button data-testid="toggle" onClick={() => setShow(s => !s)}>Toggle</button>
          {show && <Focusable id="temp">Temp</Focusable>}
        </>
      );
    }
    render(
      <GamepadNavigationProvider>
        <Inspector />
        <Toggle />
      </GamepadNavigationProvider>
    );
    expect(focusablesList.some(f => f.id === 'temp')).toBe(true);
    act(() => {
      screen.getByTestId('toggle').click();
    });
    expect(focusablesList.some(f => f.id === 'temp')).toBe(false);
  });

  it('active element gets focusable-active class', () => {
    render(
      <GamepadNavigationProvider>
        <Inspector />
        <Focusable id="highlighted">HL</Focusable>
      </GamepadNavigationProvider>
    );
    const el = screen.getByText('HL').closest('div')!;
    expect(el.classList.contains('focusable-active')).toBe(false);
    act(() => setActiveFn!('highlighted'));
    // re-render po zmianie activeId — advanceTimersByTime zamiast runAllTimers
    // (runAllTimers powoduje infinite loop bo context ma setInterval 50ms)
    act(() => { vi.advanceTimersByTime(100); });
    expect(screen.getByText('HL').closest('div')!.className).toContain('focusable-active');
  });

  it('nieaktywny element NIE ma klasy focusable-active', () => {
    render(
      <GamepadNavigationProvider>
        <Inspector />
        <Focusable id="one">One</Focusable>
        <Focusable id="two">Two</Focusable>
      </GamepadNavigationProvider>
    );
    act(() => setActiveFn!('one'));
    act(() => { vi.advanceTimersByTime(100); });
    const elTwo = screen.getByText('Two').closest('div')!;
    expect(elTwo.className).not.toContain('focusable-active');
  });

  it('tabIndex=0 na elemencie Focusable', () => {
    render(
      <GamepadNavigationProvider>
        <Focusable id="tab-test">Tab</Focusable>
      </GamepadNavigationProvider>
    );
    const el = screen.getByText('Tab').closest('div')!;
    expect(el.getAttribute('tabindex')).toBe('0');
  });

  it('aria-label defaults to id', () => {
    render(
      <GamepadNavigationProvider>
        <Focusable id="my-btn">Click</Focusable>
      </GamepadNavigationProvider>
    );
    expect(screen.getByLabelText('my-btn')).toBeTruthy();
  });

  it('aria-label nadpisywany przez prop', () => {
    render(
      <GamepadNavigationProvider>
        <Focusable id="custom-aria" ariaLabel="Przycisk OK">Click</Focusable>
      </GamepadNavigationProvider>
    );
    expect(screen.getByLabelText('Przycisk OK')).toBeTruthy();
  });

  it('multiple Focusable register simultaneously', () => {
    render(
      <GamepadNavigationProvider>
        <Inspector />
        <Focusable id="f1">1</Focusable>
        <Focusable id="f2">2</Focusable>
        <Focusable id="f3">3</Focusable>
      </GamepadNavigationProvider>
    );
    expect(focusablesList).toHaveLength(3);
    expect(focusablesList.map(f => f.id).sort()).toEqual(['f1', 'f2', 'f3']);
  });
});
