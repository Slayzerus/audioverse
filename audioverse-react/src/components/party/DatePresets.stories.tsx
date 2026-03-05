import type { Meta, StoryObj } from '@storybook/react';
import DatePresets from './DatePresets';

const meta: Meta<typeof DatePresets> = {
  title: 'Party/DatePresets',
  component: DatePresets,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof DatePresets>;

export const Default: Story = {
  args: { onSetRange: (from, to) => alert(`From: ${from}\nTo: ${to}`) },
};

export const WithContext: Story = {
  render: () => (
    <div style={{ padding: 20, background: 'var(--card-bg, #1e1e1e)', borderRadius: 8, maxWidth: 500 }}>
      <label style={{ display: 'block', marginBottom: 8, color: 'var(--text-primary, #fff)', fontSize: 14 }}>
        Select date range:
      </label>
      <DatePresets onSetRange={(from, to) => console.log('Range:', from, to)} />
    </div>
  ),
};
