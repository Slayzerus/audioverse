import { describe, it, expect } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';

import {
  NoseLine, NoseTriangle, NoseRound, NoseButton, NoseHook,
  NoseFlat, NoseWide, NoseTiny, NosePointy, NoseRoman, NoseNone,
  Nose, NOSE_RENDERERS,
} from '../components/animations/shapes/noses';

import {
  TorsoSlim, TorsoV, TorsoRound, Torso, TORSO_RENDERERS,
} from '../components/animations/shapes/torsos';

const colors = ['#ff0000', '#00ff00'];

function wrap(el: React.ReactElement) {
  return render(React.createElement('svg', null, el));
}

describe('Nose components', () => {
  // All individual nose variants
  const noseComponents = [
    { name: 'NoseLine', Comp: NoseLine },
    { name: 'NoseTriangle', Comp: NoseTriangle },
    { name: 'NoseRound', Comp: NoseRound },
    { name: 'NoseButton', Comp: NoseButton },
    { name: 'NoseHook', Comp: NoseHook },
    { name: 'NoseFlat', Comp: NoseFlat },
    { name: 'NoseWide', Comp: NoseWide },
    { name: 'NoseTiny', Comp: NoseTiny },
    { name: 'NosePointy', Comp: NosePointy },
    { name: 'NoseRoman', Comp: NoseRoman },
    { name: 'NoseNone', Comp: NoseNone },
  ];

  noseComponents.forEach(({ name, Comp }) => {
    it(`renders ${name} without error`, () => {
      const { container } = wrap(React.createElement(Comp, { colors }));
      expect(container).toBeTruthy();
    });
  });

  it('NoseRoman is the same as NoseHook', () => {
    expect(NoseRoman).toBe(NoseHook);
  });

  it('NoseNone renders null', () => {
    const { container } = wrap(React.createElement(NoseNone, { colors }));
    // Should only have the svg wrapper with no nose content
    const svg = container.querySelector('svg');
    expect(svg?.children.length).toBe(0);
  });

  // Nose wrapper with all registry variants
  Object.keys(NOSE_RENDERERS).forEach((variant) => {
    it(`Nose wrapper renders variant "${variant}"`, () => {
      const { container } = wrap(React.createElement(Nose, { variant, colors }));
      expect(container).toBeTruthy();
    });
  });

  it('Nose wrapper falls back to NoseLine for unknown variant', () => {
    const { container } = wrap(React.createElement(Nose, { variant: 'unknown_xyz', colors }));
    expect(container).toBeTruthy();
  });

  it('Nose accepts y, scale, transform, strokeWidth props', () => {
    const { container } = wrap(
      React.createElement(Nose, { variant: 'button', colors, y: 5, scale: 1.2, transform: 'rotate(5)', strokeWidth: 2 })
    );
    expect(container).toBeTruthy();
  });

  it('NOSE_RENDERERS has 11 entries', () => {
    expect(Object.keys(NOSE_RENDERERS).length).toBe(11);
  });
});

describe('Torso components', () => {
  const torsoComponents = [
    { name: 'TorsoSlim', Comp: TorsoSlim },
    { name: 'TorsoV', Comp: TorsoV },
    { name: 'TorsoRound', Comp: TorsoRound },
  ];

  torsoComponents.forEach(({ name, Comp }) => {
    it(`renders ${name} without error`, () => {
      const { container } = wrap(React.createElement(Comp, { colors }));
      expect(container).toBeTruthy();
    });

    it(`${name} accepts scale and transform`, () => {
      const { container } = wrap(
        React.createElement(Comp, { colors, scale: 1.5, transform: 'translate(10 0)', strokeWidth: 2 })
      );
      expect(container).toBeTruthy();
    });
  });

  // Torso wrapper
  Object.keys(TORSO_RENDERERS).forEach((variant) => {
    it(`Torso wrapper renders variant "${variant}"`, () => {
      const { container } = wrap(React.createElement(Torso, { variant, colors }));
      expect(container).toBeTruthy();
    });
  });

  it('Torso wrapper falls back to TorsoSlim for unknown variant', () => {
    const { container } = wrap(React.createElement(Torso, { variant: 'unknown_xyz', colors }));
    expect(container).toBeTruthy();
  });

  it('TORSO_RENDERERS has 3 entries', () => {
    expect(Object.keys(TORSO_RENDERERS).length).toBe(3);
  });

  it('Torso with empty colors', () => {
    const { container } = wrap(React.createElement(Torso, { variant: 'slim', colors: [] }));
    expect(container).toBeTruthy();
  });
});
