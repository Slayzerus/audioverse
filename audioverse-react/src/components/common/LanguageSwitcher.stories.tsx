import type { Meta, StoryObj } from '@storybook/react';
import LanguageSwitcher from './LanguageSwitcher';

const meta: Meta<typeof LanguageSwitcher> = {
  title: 'Common/LanguageSwitcher',
  component: LanguageSwitcher,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof LanguageSwitcher>;

export const Default: Story = {};

export const InNavbar: Story = {
  render: () => (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
      gap: 16, padding: '8px 16px',
      background: 'var(--nav-bg, #1a1a2e)',
      borderRadius: 8,
    }}>
      <span style={{ color: 'var(--text-secondary, #aaa)', fontSize: 14 }}>Navigation Bar</span>
      <LanguageSwitcher />
    </div>
  ),
};
