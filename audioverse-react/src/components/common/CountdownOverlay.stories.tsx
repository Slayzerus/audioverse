import type { Meta, StoryObj } from '@storybook/react';
import CountdownOverlay from './CountdownOverlay';

const meta: Meta<typeof CountdownOverlay> = {
  title: 'Common/CountdownOverlay',
  component: CountdownOverlay,
  tags: ['autodocs'],
  argTypes: {
    seconds: { control: { type: 'range', min: 0, max: 10, step: 1 } },
    zIndex: { control: { type: 'number' } },
  },
};
export default meta;
type Story = StoryObj<typeof CountdownOverlay>;

export const Three: Story = {
  args: { seconds: 3 },
};

export const Two: Story = {
  args: { seconds: 2 },
};

export const One: Story = {
  args: { seconds: 1 },
};

export const Zero: Story = {
  args: { seconds: 0 },
};

export const Hidden: Story = {
  args: { seconds: null },
};
