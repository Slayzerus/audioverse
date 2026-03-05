import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import OrganizerMultiSelect from '../components/party/OrganizerMultiSelect';

const options = [
  { id: '1', name: 'Alice' },
  { id: '2', name: 'Bob' },
  { id: '3', name: 'Charlie' },
];

test('OrganizerMultiSelect renders and allows selecting items', () => {
  const onChange = vi.fn();
  render(<OrganizerMultiSelect label="Organizer" options={options} selectedIds={[]} onChange={onChange} />);

  const input = screen.getByPlaceholderText('Search organizer');
  expect(input).toBeInTheDocument();

  fireEvent.focus(input);
  const listbox = screen.getByRole('listbox');
  expect(listbox).toBeInTheDocument();

  expect(screen.getByText('Alice')).toBeInTheDocument();

  const aliceLabel = screen.getByText('Alice').closest('label');
  const aliceCheckbox = aliceLabel?.querySelector('input');
  expect(aliceCheckbox).toBeTruthy();
  fireEvent.click(aliceCheckbox as HTMLElement);
  expect(onChange).toHaveBeenCalled();
});
