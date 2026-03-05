import type { Meta, StoryObj } from '@storybook/react';
import StatCard from './StatCard';

const meta: Meta<typeof StatCard> = {
  title: 'Common/StatCard',
  component: StatCard,
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
    value: { control: 'text' },
    color: { control: 'color' },
  },
};
export default meta;
type Story = StoryObj<typeof StatCard>;

export const Default: Story = {
  args: { label: 'Total Songs', value: 42 },
};

export const WithColor: Story = {
  args: { label: 'Active Players', value: 8, color: 'var(--stat-success, #4caf50)' },
};

export const StringValue: Story = {
  args: { label: 'Status', value: 'Online', color: 'var(--stat-warning, #ff9800)' },
};

export const LargeNumber: Story = {
  args: { label: 'Total Score', value: '1,234,567' },
};

export const Gallery: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
      <StatCard label="Songs" value={156} />
      <StatCard label="Players" value={8} color="var(--stat-success, #4caf50)" />
      <StatCard label="Parties" value={23} color="var(--stat-warning, #ff9800)" />
      <StatCard label="Score" value="98.5%" color="var(--stat-accent, #e91e63)" />
    </div>
  ),
};
