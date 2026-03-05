import { describe, it, expect } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';

// Import wrapper components
import { Hair } from '../components/animations/shapes/hair';
import { Head } from '../components/animations/shapes/heads';
import { Eyes } from '../components/animations/shapes/eyes';
import { Mouth } from '../components/animations/shapes/mouths';
import { Headwear } from '../components/animations/shapes/headwear';
import { Outfit } from '../components/animations/shapes/outfits';

const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00'];

function wrap(el: React.ReactElement) {
  return render(React.createElement('svg', null, el));
}

describe('SVG shape components', () => {
  // ---- Hair ----
  describe('Hair', () => {
    const hairVariants = [
      'none', 'short', 'long', 'curly', 'wavy', 'mohawk', 'afro',
      'bunHigh', 'bunLow', 'bob', 'pixie', 'sidePart', 'undercut',
      'spiky', 'braids', 'dreadlocks', 'ponytail', 'twinTails',
      'mullet', 'balding', 'bangs',
    ];
    hairVariants.forEach((v) => {
      it(`renders variant "${v}"`, () => {
        const { container } = wrap(React.createElement(Hair, { variant: v, colors }));
        expect(container).toBeTruthy();
      });
    });
    it('unknown variant falls back to none (renders empty)', () => {
      const { container } = wrap(React.createElement(Hair, { variant: 'unknown_xyz', colors }));
      expect(container).toBeTruthy();
    });
    it('renders with empty colors', () => {
      const { container } = wrap(React.createElement(Hair, { variant: 'short', colors: [] }));
      expect(container).toBeTruthy();
    });
  });

  // ---- Heads ----
  describe('Head', () => {
    const headVariants = [
      'round', 'oval', 'square', 'heart', 'diamond', 'long', 'chubby',
      'flatTop', 'egg', 'triangle', 'hex', 'pear', 'bean', 'heroJaw',
    ];
    headVariants.forEach((v) => {
      it(`renders variant "${v}"`, () => {
        const { container } = wrap(React.createElement(Head, { variant: v, colors }));
        expect(container).toBeTruthy();
      });
    });
    it('unknown variant uses fallback', () => {
      const { container } = wrap(React.createElement(Head, { variant: 'alien', colors }));
      expect(container).toBeTruthy();
    });
  });

  // ---- Eyes ----
  describe('Eyes', () => {
    const eyeVariants = [
      'classic', 'anime', 'sleepy', 'angry', 'surprised', 'winkLeft',
      'winkRight', 'smile', 'oval', 'upturned', 'downturned', 'lashes',
      'sparkle', 'heart', 'star', 'sad', 'focused', 'big', 'dot',
    ];
    eyeVariants.forEach((v) => {
      it(`renders variant "${v}"`, () => {
        const { container } = wrap(React.createElement(Eyes, { variant: v, colors }));
        expect(container).toBeTruthy();
      });
    });
    it('renders with eyebrows=true', () => {
      const { container } = wrap(
        React.createElement(Eyes, { variant: 'classic', colors, eyebrows: true })
      );
      expect(container).toBeTruthy();
    });
    it('renders with eyebrows=false', () => {
      const { container } = wrap(
        React.createElement(Eyes, { variant: 'anime', colors, eyebrows: false })
      );
      expect(container).toBeTruthy();
    });
    it('unknown variant uses fallback', () => {
      const { container } = wrap(React.createElement(Eyes, { variant: 'nope', colors }));
      expect(container).toBeTruthy();
    });
  });

  // ---- Mouths ----
  describe('Mouth', () => {
    const mouthVariants = [
      'smile', 'frown', 'open', 'flat', 'o', 'grin', 'teeth',
      'smirk', 'wow', 'tongue', 'laugh', 'sad', 'angry', 'kiss', 'grimace',
    ];
    mouthVariants.forEach((v) => {
      it(`renders variant "${v}"`, () => {
        const { container } = wrap(React.createElement(Mouth, { variant: v, colors }));
        expect(container).toBeTruthy();
      });
    });
    it('unknown variant uses fallback', () => {
      const { container } = wrap(React.createElement(Mouth, { variant: 'xxx', colors }));
      expect(container).toBeTruthy();
    });
  });

  // ---- Headwear ----
  describe('Headwear', () => {
    const hwVariants = [
      'none', 'cap', 'headphones', 'hat', 'crown', 'beanie',
      'bandana', 'tiara', 'tophat', 'visor', 'helmet', 'beret', 'bow',
    ];
    hwVariants.forEach((v) => {
      it(`renders variant "${v}"`, () => {
        const { container } = wrap(React.createElement(Headwear, { variant: v, colors }));
        expect(container).toBeTruthy();
      });
    });
    it('unknown variant uses fallback', () => {
      const { container } = wrap(React.createElement(Headwear, { variant: 'zzz', colors }));
      expect(container).toBeTruthy();
    });
  });

  // ---- Outfits ----
  describe('Outfit', () => {
    const outfitVariants = [
      'tee', 'hoodie', 'suit', 'dress', 'tank', 'blazer',
      'stripes', 'checker', 'jersey', 'tux',
      'kimono', 'polo', 'vest', 'jacket', 'sweatshirt', 'robe',
    ];
    outfitVariants.forEach((v) => {
      it(`renders variant "${v}"`, () => {
        const { container } = wrap(React.createElement(Outfit, { variant: v, colors }));
        expect(container).toBeTruthy();
      });
    });
    it('unknown variant uses fallback', () => {
      const { container } = wrap(React.createElement(Outfit, { variant: 'toga', colors }));
      expect(container).toBeTruthy();
    });
    it('renders with empty colors', () => {
      const { container } = wrap(React.createElement(Outfit, { variant: 'checker', colors: [] }));
      expect(container).toBeTruthy();
    });
  });
});
