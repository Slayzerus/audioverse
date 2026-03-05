/**
 * Tests for <Jurors /> and <AnimatedPerson /> components
 * Covers: fillTo4, rendering 4 animated persons, imperative handle, effects
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React, { createRef } from 'react';
import { render, act } from '@testing-library/react';

/* ---- Mock framer-motion ---- */
vi.mock('framer-motion', () => ({
  motion: new Proxy({}, {
    get: (_target, prop) => {
      // Return a forwardRef component for every tag (div, g, svg, etc.)
      return React.forwardRef((props: any, ref: any) => {
        const { animate, initial, whileHover, whileTap, transition, variants, ...rest } = props;
        const Tag = String(prop);
        return React.createElement(Tag, { ...rest, ref });
      });
    },
  }),
  useAnimation: () => ({
    start: vi.fn().mockResolvedValue(undefined),
    set: vi.fn(),
    stop: vi.fn(),
  }),
  AnimatePresence: ({ children }: any) => children,
}));

/* ---- Mock animationHelper ---- */
const mockFx = () => ({
  root: {},
  head: {},
  body: {},
  eyes: {},
  mouth: {},
  leftArm: {},
  rightArm: {},
  card: {},
  curse: {},
  setEmotion: vi.fn(),
  setMouth: vi.fn(),
  setEyes: vi.fn(),
  showCard: vi.fn().mockResolvedValue(undefined),
  hideCard: vi.fn().mockResolvedValue(undefined),
  wave: vi.fn().mockResolvedValue(undefined),
  jump: vi.fn().mockResolvedValue(undefined),
  waveHand: vi.fn().mockResolvedValue(undefined),
  nod: vi.fn().mockResolvedValue(undefined),
  shake: vi.fn().mockResolvedValue(undefined),
  idle: vi.fn().mockResolvedValue(undefined),
});

const mockControlsInstances: ReturnType<typeof mockFx>[] = [];

vi.mock('../components/animations/animationHelper', () => ({
  usePersonControls: () => {
    const fx = mockFx();
    mockControlsInstances.push(fx);
    return fx;
  },
  playPose: vi.fn().mockResolvedValue(undefined),
}));

/* ---- Mock karaokeIntegration ---- */
const mockPlayIntro = vi.fn().mockResolvedValue(undefined);
const mockAttachScoreReactions = vi.fn(() => vi.fn()); // returns detach fn
const mockReactionForScore = vi.fn(() => ({ build: () => [] }));

vi.mock('../components/animations/karaokeIntegration', () => ({
  playIntro: (...args: any[]) => mockPlayIntro(...args),
  attachScoreReactions: (...args: any[]) => mockAttachScoreReactions(...args),
  reactionForScore: (...args: any[]) => mockReactionForScore(...args),
}));

/* ---- Mock choreoDSL ---- */
vi.mock('../components/animations/choreoDSL', () => ({
  seq: () => ({
    waveHand: () => ({ build: () => [] }),
    jump: () => ({ build: () => [] }),
    build: () => [],
  }),
  runWave: vi.fn().mockResolvedValue(undefined),
  runCannon: vi.fn().mockResolvedValue(undefined),
  runRounds: vi.fn().mockResolvedValue(undefined),
}));

/* ---- Mock BodyRenderer ---- */
vi.mock('../components/animations/BodyRenderer.tsx', () => ({
  default: () => React.createElement('div', { 'data-testid': 'body-renderer' }),
}));

import Jurors, { type JurorsHandle } from '../components/animations/Jurors';
import AnimatedPerson from '../components/animations/AnimatedPerson';
import { DEFAULT_CHARACTER } from '../components/animations/characterTypes';

beforeEach(() => {
  vi.clearAllMocks();
  mockControlsInstances.length = 0;
});

describe('AnimatedPerson', () => {
  it('renders without errors', () => {
    const { container } = render(<AnimatedPerson />);
    expect(container.querySelector('svg')).toBeTruthy();
  });

  it('calls onReady with controls', () => {
    const onReady = vi.fn();
    render(<AnimatedPerson onReady={onReady} />);
    expect(onReady).toHaveBeenCalledTimes(1);
    expect(onReady.mock.calls[0][0]).toBeTruthy();
  });

  it('renders with custom character config', () => {
    const cfg = {
      ...DEFAULT_CHARACTER,
      name: 'TestJuror',
      face: { variant: 'oval' as const, colors: ['#FFD2B3'] },
      eyes: { variant: 'wink' as const, colors: ['#111'] },
      mouth: { variant: 'frown' as const, colors: ['#111'] },
      nose: { variant: 'triangle' as const, colors: ['#111'] },
      hair: { variant: 'curly' as const, colors: ['#1F2937'] },
      outfit: { variant: 'suit' as const, colors: ['#3B82F6'] },
      headwear: { variant: 'cap' as const, colors: ['#111'] },
      prop: { variant: 'mic' as const, colors: ['#111'] },
    };
    const { container } = render(<AnimatedPerson character={cfg} />);
    expect(container.querySelector('svg')).toBeTruthy();
  });

  it('uses default size from character config', () => {
    const { container } = render(<AnimatedPerson />);
    // Default size is 180
    const div = container.firstChild as HTMLElement;
    expect(div.style.width).toBe('180px');
  });

  it('renders score text on card', () => {
    const { container } = render(<AnimatedPerson score={9.5} />);
    const text = container.querySelector('text');
    expect(text?.textContent).toBe('9.5');
  });

  it('renders all outfit variants', () => {
    for (const variant of ['hoodie', 'suit', 'dress', 'tee'] as const) {
      const { unmount } = render(
        <AnimatedPerson character={{ ...DEFAULT_CHARACTER, outfit: { variant, colors: ['#f00'] } }} />,
      );
      unmount();
    }
  });

  it('renders all hair variants', () => {
    for (const variant of ['long', 'curly', 'mohawk', 'short', 'none'] as const) {
      const { unmount } = render(
        <AnimatedPerson character={{ ...DEFAULT_CHARACTER, hair: { variant, colors: ['#000'] } }} />,
      );
      unmount();
    }
  });

  it('renders all face variants', () => {
    for (const variant of ['oval', 'square', 'heart', 'round'] as const) {
      const { unmount } = render(
        <AnimatedPerson character={{ ...DEFAULT_CHARACTER, face: { variant, colors: ['#FFD2B3'] } }} />,
      );
      unmount();
    }
  });

  it('renders all eye variants', () => {
    for (const variant of ['oval', 'laugh', 'wink', 'sleepy', 'dot'] as const) {
      const { unmount } = render(
        <AnimatedPerson character={{ ...DEFAULT_CHARACTER, eyes: { variant, colors: ['#111'] } }} />,
      );
      unmount();
    }
  });

  it('renders all nose variants', () => {
    for (const variant of ['triangle', 'round', 'line'] as const) {
      const { unmount } = render(
        <AnimatedPerson character={{ ...DEFAULT_CHARACTER, nose: { variant, colors: ['#111'] } }} />,
      );
      unmount();
    }
  });

  it('renders all mouth variants', () => {
    for (const variant of ['frown', 'open', 'flat', 'o', 'teeth', 'smile'] as const) {
      const { unmount } = render(
        <AnimatedPerson character={{ ...DEFAULT_CHARACTER, mouth: { variant, colors: ['#111', '#fff'] } }} />,
      );
      unmount();
    }
  });

  it('renders all headwear variants', () => {
    for (const variant of ['cap', 'headphones', 'hat', 'crown', 'none'] as const) {
      const { unmount } = render(
        <AnimatedPerson character={{ ...DEFAULT_CHARACTER, headwear: { variant, colors: ['#111', '#222'] } }} />,
      );
      unmount();
    }
  });

  it('renders all prop variants', () => {
    for (const variant of ['mic', 'clipboard', 'star', 'none'] as const) {
      const { unmount } = render(
        <AnimatedPerson character={{ ...DEFAULT_CHARACTER, prop: { variant, colors: ['#111', '#666', '#CCC'] } }} />,
      );
      unmount();
    }
  });

  it('renders aria-label from character name', () => {
    const cfg = { ...DEFAULT_CHARACTER, name: 'Judge1' };
    const { container } = render(<AnimatedPerson character={cfg} />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('aria-label')).toBe('Judge1');
  });
});

describe('Jurors', () => {
  it('renders 4 AnimatedPerson children', () => {
    const { container } = render(<Jurors />);
    // Each AnimatedPerson renders an svg
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBe(4);
  });

  it('fills characters to 4 with defaults', () => {
    // Provide only 2 characters
    const chars = [
      { ...DEFAULT_CHARACTER, name: 'A' },
      { ...DEFAULT_CHARACTER, name: 'B' },
    ];
    const { container } = render(<Jurors characters={chars} />);
    expect(container.querySelectorAll('svg').length).toBe(4);
  });

  it('attaches score reactions when autoReact=true (default)', () => {
    render(<Jurors />);
    expect(mockAttachScoreReactions).toHaveBeenCalled();
  });

  it('does not attach score reactions when autoReact=false', () => {
    render(<Jurors autoReact={false} />);
    expect(mockAttachScoreReactions).not.toHaveBeenCalled();
  });

  it('plays intro on mount when requested', () => {
    render(<Jurors playIntroOnMount />);
    expect(mockPlayIntro).toHaveBeenCalled();
  });

  it('exposes imperative handle', async () => {
    const ref = createRef<JurorsHandle>();
    render(<Jurors ref={ref} />);
    expect(ref.current).toBeTruthy();
    expect(ref.current!.getActors).toBeTypeOf('function');
    expect(ref.current!.playIntro).toBeTypeOf('function');
    expect(ref.current!.reactToScore).toBeTypeOf('function');
    expect(ref.current!.wave).toBeTypeOf('function');
    expect(ref.current!.cannon).toBeTypeOf('function');
    expect(ref.current!.run).toBeTypeOf('function');
  });

  it('handle.getActors() returns actors', () => {
    const ref = createRef<JurorsHandle>();
    render(<Jurors ref={ref} />);
    const actors = ref.current!.getActors();
    expect(actors.length).toBeGreaterThan(0);
  });

  it('handle.playIntro() calls playIntro', async () => {
    const ref = createRef<JurorsHandle>();
    render(<Jurors ref={ref} />);
    await act(async () => { await ref.current!.playIntro(); });
    expect(mockPlayIntro).toHaveBeenCalled();
  });

  it('handle.reactToScore() creates reaction programs', async () => {
    const { runRounds } = await import('../components/animations/choreoDSL');
    const ref = createRef<JurorsHandle>();
    render(<Jurors ref={ref} />);
    await act(async () => { await ref.current!.reactToScore(85); });
    expect(mockReactionForScore).toHaveBeenCalledWith(85);
    expect(runRounds).toHaveBeenCalled();
  });

  it('handle.wave() calls runWave', async () => {
    const { runWave } = await import('../components/animations/choreoDSL');
    const ref = createRef<JurorsHandle>();
    render(<Jurors ref={ref} />);
    await act(async () => { await ref.current!.wave(); });
    expect(runWave).toHaveBeenCalled();
  });

  it('handle.cannon() calls runCannon', async () => {
    const { runCannon } = await import('../components/animations/choreoDSL');
    const ref = createRef<JurorsHandle>();
    render(<Jurors ref={ref} />);
    await act(async () => { await ref.current!.cannon(); });
    expect(runCannon).toHaveBeenCalled();
  });

  it('handle.run() calls runRounds', async () => {
    const { runRounds } = await import('../components/animations/choreoDSL');
    const ref = createRef<JurorsHandle>();
    render(<Jurors ref={ref} />);
    await act(async () => {
      await ref.current!.run([{ build: () => [] } as any]);
    });
    expect(runRounds).toHaveBeenCalled();
  });

  it('applies className and style props', () => {
    const { container } = render(
      <Jurors className="my-jurors" style={{ border: '1px solid red' }} />,
    );
    const div = container.firstChild as HTMLElement;
    expect(div.className).toBe('my-jurors');
    expect(div.style.border).toBe('1px solid red');
  });

  it('cleans up reaction detach on unmount', () => {
    const detach = vi.fn();
    mockAttachScoreReactions.mockReturnValue(detach);
    const { unmount } = render(<Jurors />);
    unmount();
    expect(detach).toHaveBeenCalled();
  });
});
