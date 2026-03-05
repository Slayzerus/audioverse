import type { Meta, StoryObj } from '@storybook/react';
import AnimatedPerson from './AnimatedPerson';

const meta: Meta<typeof AnimatedPerson> = {
  title: 'Animations/AnimatedPerson',
  component: AnimatedPerson,
  tags: ['autodocs'],
  argTypes: {
    size: { control: { type: 'range', min: 80, max: 400, step: 10 } },
    name: { control: 'text' },
    score: { control: 'text' },
  },
};
export default meta;
type Story = StoryObj<typeof AnimatedPerson>;

export const Default: Story = {
  args: { name: 'Player 1', size: 200 },
};

export const WithScore: Story = {
  args: { name: 'Player 1', size: 200, score: 9540 },
};

export const Small: Story = {
  args: { name: 'Mini', size: 100 },
};

export const Large: Story = {
  args: { name: 'Big Character', size: 350, score: '12,345' },
};

export const CustomCharacter: Story = {
  args: {
    name: 'Custom',
    size: 220,
    character: {
      face: { variant: 'round', colors: ['var(--anim-story-face-1, #ffcc80)'] },
      hair: { variant: 'spiky', colors: ['var(--anim-story-hair-1, #5d4037)'] },
      eyes: { variant: 'round', colors: ['var(--anim-story-eye-iris, #1976d2)'] },
      nose: { variant: 'small', colors: ['var(--anim-story-nose, #ffb74d)'] },
      mouth: { variant: 'smile', colors: ['var(--anim-story-mouth, #e57373)'] },
      outfit: { variant: 'tshirt', colors: ['var(--anim-story-outfit-1, #42a5f5)', 'var(--anim-story-outfit-2, #1565c0)'] },
      headwear: { variant: 'none', colors: [] },
      prop: { variant: 'none', colors: [] },
    },
  },
};

export const Gallery: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', padding: 20 }}>
      <AnimatedPerson name="Alice" size={160} score={8500} />
      <AnimatedPerson name="Bob" size={160} score={7200} />
      <AnimatedPerson name="Carol" size={160} score={9100} />
      <AnimatedPerson name="Dave" size={160} score={6800} />
    </div>
  ),
};
