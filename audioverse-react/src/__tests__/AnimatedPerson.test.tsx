import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock framer-motion to simple pass-through components and stubbed controls
vi.mock('framer-motion', () => {
  const React = require('react');
  const create = (tag: string) => (props: any) => React.createElement(tag, props, props.children);
  return {
    motion: {
      div: create('div'),
      g: create('g'),
    },
    useAnimationControls: () => ({ start: vi.fn() }),
  };
});

import AnimatedPerson from '../components/animations/AnimatedPerson';

describe('AnimatedPerson', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders svg and calls onReady with controls', async () => {
    const onReady = vi.fn();
    const { getAllByRole } = render(<AnimatedPerson id="p1" name="Tester" onReady={onReady} />);

    const svgs = getAllByRole('img');
    const svg = svgs.find((el) => /Tester|Juror/.test(el.getAttribute('aria-label') || ''));
    expect(svg).toBeTruthy();
    expect(svg!.getAttribute('aria-label')).toMatch(/Tester|Juror/);

    await waitFor(() => expect(onReady).toHaveBeenCalled());
    const arg = onReady.mock.calls[0][0];
    expect(arg).toBeTruthy();
    expect(typeof arg.root.start).toBe('function');
  });

  it('renders outfit variant suit when provided via character prop', () => {
    const char = {
      size: 180,
      name: 'C',
      outfit: { variant: 'suit', colors: ['#111', '#222', '#333'] },
      hair: { variant: 'short', colors: ['#111'] },
      face: { variant: 'round', colors: ['#ffd'] },
      eyes: { variant: 'dot', colors: ['#111'] },
      mouth: { variant: 'smile', colors: ['#111'] },
      nose: { variant: 'line', colors: ['#111'] },
      headwear: { variant: 'none', colors: [] },
      prop: { variant: 'none', colors: [] },
    } as any;

    const { container } = render(<AnimatedPerson character={char} />);
    // suit variant contains a path element for the lapel; ensure path exists
    expect(container.querySelector('path')).toBeTruthy();
    // ensure score text exists and defaults to 10
    expect(container.querySelector('text')?.textContent).toContain('10');
  });
});
