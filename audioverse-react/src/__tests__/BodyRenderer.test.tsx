import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import BodyRenderer from '../components/animations/BodyRenderer';

describe('BodyRenderer', () => {
  it('renders svg with expected structure for a minimal character', () => {
    const char = {
      size: 180,
      outfit: { variant: 'tee', colors: ['#3B82F6'] },
      hair: { variant: 'short', colors: ['#111'] },
      face: { variant: 'round', colors: ['#FFD2B3', '#00000000', '#111'] },
      eyes: { variant: 'dot', colors: ['#111'] },
      mouth: { variant: 'smile', colors: ['#111'] },
      nose: { variant: 'line', colors: ['#111'] },
      headwear: { variant: 'none', colors: [] },
    } as any;

    const { getByRole, container } = render(<BodyRenderer character={char} size={180} />);
    const svg = getByRole('img');
    expect(svg).toBeTruthy();

    // basic structural assertions
    expect(svg.getAttribute('viewBox')).toBeTruthy();
    // the composed output should include at least one shape element (rect/path/circle)
    const hasShape = !!container.querySelector('path, rect, circle, ellipse');
    expect(hasShape).toBe(true);
  });
});
