import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import CurtainTransition, { CURTAIN_EFFECTS, type CurtainEffect } from './CurtainTransition';

const meta: Meta<typeof CurtainTransition> = {
  title: 'Common/CurtainTransition',
  component: CurtainTransition,
  tags: ['autodocs'],
  argTypes: {
    effect: {
      control: 'select',
      options: CURTAIN_EFFECTS.map(e => e.value),
    },
    phase: { control: 'radio', options: ['cover', 'reveal'] },
    primaryColor: { control: 'color' },
    secondaryColor: { control: 'color' },
    durationMs: { control: { type: 'range', min: 200, max: 2000, step: 100 } },
  },
};
export default meta;
type Story = StoryObj<typeof CurtainTransition>;

export const FadeCover: Story = {
  args: { active: true, effect: 'fade', phase: 'cover', durationMs: 800, onComplete: () => {} },
};

export const FadeReveal: Story = {
  args: { active: true, effect: 'fade', phase: 'reveal', durationMs: 800, onComplete: () => {} },
};

export const TheaterCurtain: Story = {
  args: { active: true, effect: 'theaterCurtain', phase: 'cover', durationMs: 1000, onComplete: () => {} },
};

export const CircleIris: Story = {
  args: { active: true, effect: 'circleIris', phase: 'cover', durationMs: 800, onComplete: () => {} },
};

export const Glitch: Story = {
  args: { active: true, effect: 'glitch', phase: 'cover', durationMs: 600, onComplete: () => {} },
};

export const Pixelate: Story = {
  args: { active: true, effect: 'pixelate', phase: 'cover', durationMs: 800, onComplete: () => {} },
};

export const Interactive = () => {
  const [effect, setEffect] = useState<CurtainEffect>('fade');
  const [phase, setPhase] = useState<'cover' | 'reveal'>('cover');
  const [active, setActive] = useState(false);

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <select value={effect} onChange={e => setEffect(e.target.value as CurtainEffect)}>
          {CURTAIN_EFFECTS.map(e => (
            <option key={e.value} value={e.value}>{e.label}</option>
          ))}
        </select>
        <select value={phase} onChange={e => setPhase(e.target.value as 'cover' | 'reveal')}>
          <option value="cover">Cover</option>
          <option value="reveal">Reveal</option>
        </select>
        <button onClick={() => setActive(true)} disabled={active}>
          ▶ Play Transition
        </button>
      </div>
      <p style={{ color: '#aaa', fontSize: 13 }}>
        Current: <strong>{effect}</strong> / <strong>{phase}</strong>
        {active && ' — playing…'}
      </p>
      <CurtainTransition
        active={active}
        effect={effect}
        phase={phase}
        durationMs={800}
        onComplete={() => setActive(false)}
      />
    </div>
  );
};
