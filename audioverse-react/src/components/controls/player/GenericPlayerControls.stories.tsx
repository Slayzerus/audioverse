import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import GenericPlayerControls from './GenericPlayerControls';

const meta: Meta<typeof GenericPlayerControls> = {
  title: 'Controls/GenericPlayerControls',
  component: GenericPlayerControls,
  tags: ['autodocs'],
  argTypes: {
    isPlaying: { control: 'boolean' },
    index: { control: { type: 'number', min: 0 } },
    count: { control: { type: 'number', min: 1 } },
    currentTime: { control: { type: 'range', min: 0, max: 300, step: 1 } },
    duration: { control: { type: 'range', min: 0, max: 300, step: 1 } },
    volume: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
  },
};
export default meta;
type Story = StoryObj<typeof GenericPlayerControls>;

export const Paused: Story = {
  args: {
    isPlaying: false, index: 0, count: 5,
    currentTime: 0, duration: 210, volume: 0.75,
    onPrev: () => {}, onNext: () => {}, onToggle: () => {},
    onSeek: () => {}, onVolume: () => {},
  },
};

export const Playing: Story = {
  args: {
    isPlaying: true, index: 2, count: 10,
    currentTime: 87, duration: 245, volume: 0.5,
    onPrev: () => {}, onNext: () => {}, onToggle: () => {},
    onSeek: () => {}, onVolume: () => {},
  },
};

export const FirstTrack: Story = {
  args: {
    isPlaying: false, index: 0, count: 3,
    currentTime: 0, duration: 180, volume: 1,
    onPrev: () => {}, onNext: () => {}, onToggle: () => {},
    onSeek: () => {}, onVolume: () => {},
  },
};

export const LastTrack: Story = {
  args: {
    isPlaying: true, index: 4, count: 5,
    currentTime: 155, duration: 200, volume: 0.3,
    onPrev: () => {}, onNext: () => {}, onToggle: () => {},
    onSeek: () => {}, onVolume: () => {},
  },
};

export const Interactive = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.75);
  const [index, setIndex] = useState(2);

  return (
    <div style={{ maxWidth: 500, padding: 20 }}>
      <p style={{ color: '#64748b', fontSize: 13, margin: '0 0 12px' }}>
        Track {index + 1} / 5 — {isPlaying ? '▶ Playing' : '⏸ Paused'}
      </p>
      <GenericPlayerControls
        isPlaying={isPlaying}
        index={index}
        count={5}
        currentTime={currentTime}
        duration={240}
        volume={volume}
        onPrev={() => setIndex(i => Math.max(0, i - 1))}
        onNext={() => setIndex(i => Math.min(4, i + 1))}
        onToggle={() => setIsPlaying(p => !p)}
        onSeek={setCurrentTime}
        onVolume={setVolume}
      />
    </div>
  );
};
