import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';

// Mock framer-motion to simple pass-through components and stubbed controls
vi.mock('framer-motion', () => {
  const React = require('react');
  const create = (tag: string) => (props: any) => React.createElement(tag, props, props.children);
  return {
    motion: { div: create('div'), g: create('g') },
    useAnimationControls: () => ({ start: vi.fn() }),
  };
});

import Jurors, { type JurorsHandle } from '../components/animations/Jurors';

describe('Jurors', () => {
  it('exposes 4 actors via handle.getActors()', async () => {
    const ref = React.createRef<JurorsHandle>();
    render(<Jurors ref={ref} autoReact={false} playIntroOnMount={false} />);

    await waitFor(() => expect(ref.current).toBeTruthy());
    await waitFor(() => expect(ref.current!.getActors().length).toBe(4));
  });
});
