import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';
import { UltrastarRowItem } from './UltrastarRowItem';
import { KaraokeFormat } from '../../../models/modelsKaraoke';
import type { KaraokeSongFile } from '../../../models/modelsKaraoke';

const sampleSong: KaraokeSongFile = {
  id: 1,
  title: 'How You Remind Me',
  artist: 'Nickelback',
  format: KaraokeFormat.Ultrastar,
  notes: [],
  filePath: '/songs/nickelback-hyrmm.txt',
  bpm: 172,
  gap: 5200,
  genre: 'Rock',
  language: 'English',
  year: '2001',
};

const meta: Meta<typeof UltrastarRowItem> = {
  title: 'Library/UltrastarRowItem',
  component: UltrastarRowItem,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <MemoryRouter>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody><Story /></tbody>
        </table>
      </MemoryRouter>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof UltrastarRowItem>;

export const Unchecked: Story = {
  args: { song: sampleSong, checked: false, onToggle: () => {} },
};

export const Checked: Story = {
  args: { song: sampleSong, checked: true, onToggle: () => {} },
};

export const NoId: Story = {
  args: {
    song: { ...sampleSong, id: undefined, title: 'Unknown Song', artist: 'Unknown' },
    checked: false,
    onToggle: () => {},
  },
};

export const LongTitle: Story = {
  args: {
    song: { ...sampleSong, title: 'A Very Long Song Title That Might Overflow The Table Cell', artist: 'Artist With A Really Long Name Too' },
    checked: false,
    onToggle: () => {},
  },
};
