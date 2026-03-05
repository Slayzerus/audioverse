import type { Meta, StoryObj } from '@storybook/react';
import ContentSkeleton from './ContentSkeleton';

const meta: Meta<typeof ContentSkeleton> = {
  title: 'Common/ContentSkeleton',
  component: ContentSkeleton,
  tags: ['autodocs'],
  argTypes: {
    rows: { control: { type: 'range', min: 1, max: 10, step: 1 } },
    rowHeight: { control: { type: 'range', min: 8, max: 32, step: 2 } },
    gap: { control: { type: 'range', min: 4, max: 24, step: 2 } },
  },
};
export default meta;
type Story = StoryObj<typeof ContentSkeleton>;

export const Default: Story = {};

export const WithAvatar: Story = {
  args: { showAvatar: true, rows: 4 },
};

export const NoHeader: Story = {
  args: { showHeader: false, rows: 5 },
};

export const CompactRows: Story = {
  args: { rows: 6, rowHeight: 10, gap: 6, showHeader: false },
};

export const FullCard: Story = {
  args: { showHeader: true, showAvatar: true, rows: 5, rowHeight: 14, gap: 10 },
};

export const Gallery: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, padding: 20, maxWidth: 700 }}>
      <div style={{ background: 'var(--card-bg, #1e1e1e)', padding: 16, borderRadius: 8 }}>
        <ContentSkeleton />
      </div>
      <div style={{ background: 'var(--card-bg, #1e1e1e)', padding: 16, borderRadius: 8 }}>
        <ContentSkeleton showAvatar rows={2} />
      </div>
      <div style={{ background: 'var(--card-bg, #1e1e1e)', padding: 16, borderRadius: 8 }}>
        <ContentSkeleton showHeader={false} rows={4} rowHeight={12} />
      </div>
      <div style={{ background: 'var(--card-bg, #1e1e1e)', padding: 16, borderRadius: 8 }}>
        <ContentSkeleton showAvatar showHeader rows={6} />
      </div>
    </div>
  ),
};
