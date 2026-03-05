import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import MultiSearchSelect from '../components/ui/MultiSearchSelect';

describe('MultiSearchSelect', () => {
  const options = ['cat:Alpha', 'cat:Beta', 'Gamma'];

  it('renders label and shows 0 selected initially', () => {
    const onChange = vi.fn();
    render(<MultiSearchSelect label="Type" options={options} selected={[]} onChange={onChange} />);
    expect(screen.getByText('Type')).toBeInTheDocument();
    expect(screen.getByText(/0 selected/)).toBeInTheDocument();
  });

  it('opens listbox on focus and filters results', () => {
    const onChange = vi.fn();
    render(<MultiSearchSelect label="Type" options={options} selected={[]} onChange={onChange} />);
    const input = screen.getByPlaceholderText('Search type');
    fireEvent.focus(input);
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    // type a query that matches only Beta
    fireEvent.change(input, { target: { value: 'beta' } });
    expect(screen.queryByText('Alpha')).not.toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();

    // type a query with no matches
    fireEvent.change(input, { target: { value: 'zzz' } });
    expect(screen.getByText('No matches')).toBeInTheDocument();
  });

  it('toggles selection and calls onChange', () => {
    const onChange = vi.fn();
    render(<MultiSearchSelect label="Type" options={options} selected={[]} onChange={onChange} />);
    const input = screen.getByPlaceholderText('Search type');
    fireEvent.focus(input);

    // click the Alpha checkbox via its label
    const alphaLabel = Array.from(screen.getAllByText('Alpha'))[0]?.closest('label');
    expect(alphaLabel).toBeTruthy();
    const alphaCheckbox = alphaLabel?.querySelector('input') as HTMLElement;
    fireEvent.click(alphaCheckbox);
    expect(onChange).toHaveBeenCalledTimes(1);
    // verify the handler was called with the option key present
    expect(onChange.mock.calls[0][0]).toContain('cat:Alpha');
  });
});
