/**
 * Coverage tests for Focusable.tsx — null ref branch (lines 22-23)
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';

const { mockRegister, mockUnregister, mockError, mockDebug } = vi.hoisted(() => ({
  mockRegister: vi.fn(),
  mockUnregister: vi.fn(),
  mockError: vi.fn(),
  mockDebug: vi.fn(),
}));

vi.mock('../../contexts/GamepadNavigationContext', () => ({
  useGamepadNavigation: () => ({ register: mockRegister, unregister: mockUnregister, activeId: null, pushFocusTrap: vi.fn(), popFocusTrap: vi.fn() }),
}));

vi.mock('./useFocusableLayout', () => ({
  useFocusableLayout: () => {
    // Create a ref-like object that always returns null for .current
    // This prevents React from setting it during commit
    const nullRef: any = {};
    Object.defineProperty(nullRef, 'current', {
      get: () => null,
      set: () => {},   // ignore React's assignment
      configurable: true,
    });
    return {
      ref: nullRef,
      layout: { x: 0, y: 0, width: 0, height: 0 },
    };
  },
}));

vi.mock('../../services/navigationLogger', () => ({
  navigationLogger: { error: mockError, debug: mockDebug },
}));

import { Focusable } from './Focusable';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Focusable – null ref guard', () => {
  it('logs FOCUSABLE_REF_NULL_ON_MOUNT and skips register when ref is null', () => {
    render(<Focusable id="test-null">child</Focusable>);
    expect(mockError).toHaveBeenCalledWith(
      'FOCUSABLE_REF_NULL_ON_MOUNT',
      expect.objectContaining({ id: 'test-null' }),
    );
    expect(mockRegister).not.toHaveBeenCalled();
  });
});
