import type { Meta, StoryObj } from '@storybook/react';
import AudioActivationOverlay from './AudioActivationOverlay';

const meta: Meta<typeof AudioActivationOverlay> = {
  title: 'Common/AudioActivationOverlay',
  component: AudioActivationOverlay,
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
    subtitle: { control: 'text' },
  },
};
export default meta;
type Story = StoryObj<typeof AudioActivationOverlay>;

export const Default: Story = {
  args: { onActivated: () => alert('Audio activated!') },
};

export const CustomLabels: Story = {
  args: {
    onActivated: () => alert('Audio activated!'),
    label: 'Enable Sound 🎵',
    subtitle: 'Click anywhere or press a button to start',
  },
};

export const MinimalLabel: Story = {
  args: {
    onActivated: () => {},
    label: 'Start',
    subtitle: '',
  },
};
