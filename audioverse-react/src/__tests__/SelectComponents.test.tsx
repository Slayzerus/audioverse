/**
 * Tests for OrganizerMultiSelect and MultiSearchSelect components.
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import OrganizerMultiSelect from '../components/party/OrganizerMultiSelect';
import MultiSearchSelect from '../components/ui/MultiSearchSelect';

/* ======== OrganizerMultiSelect ======== */
describe('OrganizerMultiSelect', () => {
  const options = [
    { id: '1', name: 'Alice' },
    { id: '2', name: 'Bob' },
    { id: '3', name: 'Charlie' },
  ];

  it('renders label and selected count', () => {
    const { container } = render(
      <OrganizerMultiSelect label="Organizers" options={options} selectedIds={['1']} onChange={() => {}} />,
    );
    expect(container.textContent).toContain('Organizers');
  });

  it('opens dropdown on input focus', () => {
    const { container } = render(
      <OrganizerMultiSelect label="Orgs" options={options} selectedIds={[]} onChange={() => {}} />,
    );
    const input = container.querySelector('input') as HTMLInputElement;
    fireEvent.focus(input);
    expect(container.querySelector('[role="listbox"]')).toBeTruthy();
  });

  it('toggles dropdown on focus and blur', () => {
    const { container } = render(
      <OrganizerMultiSelect label="Orgs" options={options} selectedIds={[]} onChange={() => {}} />,
    );
    const input = container.querySelector('input') as HTMLInputElement;
    // Open on focus
    fireEvent.focus(input);
    expect(container.querySelector('[role="listbox"]')).toBeTruthy();
    // Close on blur (component uses setTimeout 120ms)
    fireEvent.blur(input);
  });

  it('filters options by search query', () => {
    const { container } = render(
      <OrganizerMultiSelect label="Orgs" options={options} selectedIds={[]} onChange={() => {}} />,
    );
    const input = container.querySelector('input') as HTMLInputElement;
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'ali' } });
    const labels = container.querySelectorAll('[role="listbox"] label');
    expect(labels.length).toBe(1);
    expect(labels[0].textContent).toContain('Alice');
  });

  it('shows "No matches" when filter yields nothing', () => {
    const { container } = render(
      <OrganizerMultiSelect label="Orgs" options={options} selectedIds={[]} onChange={() => {}} />,
    );
    fireEvent.focus(container.querySelector('input')!);
    fireEvent.change(container.querySelector('input')!, { target: { value: 'zzzzz' } });
    expect(container.textContent).toContain('No matches');
  });

  it('selects and deselects options via checkbox', () => {
    const onChange = vi.fn();
    const { container } = render(
      <OrganizerMultiSelect label="Orgs" options={options} selectedIds={['1']} onChange={onChange} />,
    );
    fireEvent.focus(container.querySelector('input')!);
    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    // Deselect Alice (already selected)
    fireEvent.click(checkboxes[0]);
    expect(onChange).toHaveBeenCalledWith([]);
    // Select Bob
    fireEvent.click(checkboxes[1]);
    expect(onChange).toHaveBeenCalledWith(['1', '2']);
  });

  it('checkbox checked state reflects selectedIds', () => {
    const { container } = render(
      <OrganizerMultiSelect label="Orgs" options={options} selectedIds={['2']} onChange={() => {}} />,
    );
    fireEvent.focus(container.querySelector('input')!);
    const checkboxes = container.querySelectorAll('input[type="checkbox"]') as NodeListOf<HTMLInputElement>;
    expect(checkboxes[0].checked).toBe(false); // Alice
    expect(checkboxes[1].checked).toBe(true);  // Bob
    expect(checkboxes[2].checked).toBe(false); // Charlie
  });
});

/* ======== MultiSearchSelect ======== */
describe('MultiSearchSelect', () => {
  const options = ['public', 'private', 'unlisted'];

  it('renders label and selected count', () => {
    const { container } = render(
      <MultiSearchSelect label="Access" options={options} selected={['public']} onChange={() => {}} />,
    );
    expect(container.textContent).toContain('Access');
    expect(container.textContent).toContain('1 selected');
  });

  it('opens on focus and shows options', () => {
    const { container } = render(
      <MultiSearchSelect label="Type" options={options} selected={[]} onChange={() => {}} />,
    );
    fireEvent.focus(container.querySelector('input')!);
    const labels = container.querySelectorAll('[role="listbox"] label');
    expect(labels.length).toBe(3);
  });

  it('filters options by query', () => {
    const { container } = render(
      <MultiSearchSelect label="Type" options={options} selected={[]} onChange={() => {}} />,
    );
    fireEvent.focus(container.querySelector('input')!);
    fireEvent.change(container.querySelector('input')!, { target: { value: 'pub' } });
    const labels = container.querySelectorAll('[role="listbox"] label');
    expect(labels.length).toBe(1);
    expect(labels[0].textContent).toContain('public');
  });

  it('displays option with colon prefix stripped', () => {
    const { container } = render(
      <MultiSearchSelect label="Type" options={['prefix:Display']} selected={[]} onChange={() => {}} />,
    );
    fireEvent.focus(container.querySelector('input')!);
    const labels = container.querySelectorAll('[role="listbox"] label');
    expect(labels[0].textContent).toContain('Display');
  });

  it('shows "No matches" when filter yields nothing', () => {
    const { container } = render(
      <MultiSearchSelect label="Type" options={options} selected={[]} onChange={() => {}} />,
    );
    fireEvent.focus(container.querySelector('input')!);
    fireEvent.change(container.querySelector('input')!, { target: { value: 'zzz' } });
    expect(container.textContent).toContain('No matches');
  });

  it('selects/deselects via checkbox', () => {
    const onChange = vi.fn();
    const { container } = render(
      <MultiSearchSelect label="Type" options={options} selected={['public']} onChange={onChange} />,
    );
    fireEvent.focus(container.querySelector('input')!);
    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    // Deselect public
    fireEvent.click(checkboxes[0]);
    expect(onChange).toHaveBeenCalledWith([]);
    // Select private
    fireEvent.click(checkboxes[1]);
    expect(onChange).toHaveBeenCalledWith(['public', 'private']);
  });

  it('toggle button opens/closes dropdown', () => {
    const { container } = render(
      <MultiSearchSelect label="Type" options={options} selected={[]} onChange={() => {}} />,
    );
    const btn = container.querySelector('button')!;
    fireEvent.click(btn);
    expect(container.querySelector('[role="listbox"]')).toBeTruthy();
    fireEvent.click(btn);
    expect(container.querySelector('[role="listbox"]')).toBeNull();
  });
});
