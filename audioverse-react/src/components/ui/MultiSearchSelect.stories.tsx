import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import MultiSearchSelect from './MultiSearchSelect';

const meta: Meta<typeof MultiSearchSelect> = {
  title: 'UI/MultiSearchSelect',
  component: MultiSearchSelect,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof MultiSearchSelect>;

export const Default: Story = {
  args: { label: 'Types', options: ['Public', 'Private', 'Invite Only'], selected: [], onChange: () => {} },
};

export const WithSelections: Story = {
  args: { label: 'Genres', options: ['Rock', 'Pop', 'Jazz', 'Electronic', 'Classical'], selected: ['Rock', 'Pop'], onChange: () => {} },
};

export const Interactive = () => {
  const [selected, setSelected] = useState<string[]>([]);
  const options = ['Rock', 'Pop', 'Jazz', 'Electronic', 'Classical', 'Hip Hop', 'Country'];
  return (
    <div style={{ padding: 20 }}>
      <p>Selected: {selected.join(', ') || '(none)'}</p>
      <MultiSearchSelect label="Music Genres" options={options} selected={selected} onChange={setSelected} />
    </div>
  );
};

export const ManyOptions: Story = {
  args: {
    label: 'Languages',
    options: ['English', 'Polish', 'German', 'French', 'Spanish', 'Italian', 'Japanese', 'Korean', 'Chinese', 'Portuguese'],
    selected: ['English', 'Polish'],
    onChange: () => {},
  },
};
