import type { Meta, StoryObj } from '@storybook/react';
import CircularLoader from './CircularLoader';

const meta: Meta<typeof CircularLoader> = {
  title: 'Common/CircularLoader',
  component: CircularLoader,
  tags: ['autodocs'],
  argTypes: {
    size: { control: { type: 'range', min: 16, max: 128, step: 4 } },
    color: { control: 'color' },
  },
};
export default meta;
type Story = StoryObj<typeof CircularLoader>;

export const Default: Story = {};

export const Small: Story = {
  args: { size: 16 },
};

export const Large: Story = {
  args: { size: 64 },
};

export const CustomColor: Story = {
  args: { size: 48, color: '#e91e63' },
};

export const Gallery: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 24, alignItems: 'center', padding: 20 }}>
      <CircularLoader size={16} />
      <CircularLoader size={32} />
      <CircularLoader size={48} color="#4caf50" />
      <CircularLoader size={64} color="#2196f3" />
      <CircularLoader size={96} color="#ff9800" />
    </div>
  ),
};
