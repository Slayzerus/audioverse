import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Focusable, type FocusHighlightMode } from './Focusable';
import { GamepadNavigationProvider } from '../../contexts/GamepadNavigationContext';

const withGamepad = (Story: React.ComponentType) => (
  <GamepadNavigationProvider>
    <Story />
  </GamepadNavigationProvider>
);

const meta: Meta<typeof Focusable> = {
  title: 'Common/Focusable',
  component: Focusable,
  tags: ['autodocs'],
  decorators: [withGamepad],
  argTypes: {
    highlightMode: {
      control: 'select',
      options: ['outline', 'dim', 'brighten', 'glow', 'scale'] satisfies FocusHighlightMode[],
    },
  },
};
export default meta;
type Story = StoryObj<typeof Focusable>;

export const Default: Story = {
  args: {
    id: 'story-focusable-default',
    children: <div style={{ padding: 16, background: 'var(--card-bg, #2a2a2a)', borderRadius: 8 }}>Focusable element — use Tab to focus</div>,
  },
};

export const WithGlow: Story = {
  args: {
    id: 'story-focusable-glow',
    highlightMode: 'glow',
    children: <div style={{ padding: 16, background: 'var(--card-bg, #2a2a2a)', borderRadius: 8 }}>Glow highlight mode</div>,
  },
};

export const WithScale: Story = {
  args: {
    id: 'story-focusable-scale',
    highlightMode: 'scale',
    children: <div style={{ padding: 16, background: 'var(--card-bg, #2a2a2a)', borderRadius: 8 }}>Scale highlight mode</div>,
  },
};

export const AllHighlightModes = () => {
  const modes: FocusHighlightMode[] = ['outline', 'dim', 'brighten', 'glow', 'scale'];
  const [focused, setFocused] = useState<string | null>(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 20, maxWidth: 400 }}>
      <p style={{ color: '#aaa', fontSize: 13, margin: 0 }}>
        Tab through items to see each highlight mode. Focused: <strong>{focused || '(none)'}</strong>
      </p>
      {modes.map(mode => (
        <Focusable
          key={mode}
          id={`story-${mode}`}
          highlightMode={mode}
        >
          <div
            onFocus={() => setFocused(mode)}
            style={{ padding: 16, background: 'var(--card-bg, #2a2a2a)', borderRadius: 8, cursor: 'pointer' }}
          >
            <strong>{mode}</strong> — focus this element
          </div>
        </Focusable>
      ))}
    </div>
  );
};
