import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import PaginationControls from '../components/ui/PaginationControls';

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => {
            const map: Record<string, string> = {
                'pagination.prev': 'Prev',
                'pagination.next': 'Next',
                'pagination.pageSize': 'Page size',
                'pagination.total': 'Total',
            };
            return map[key] ?? key;
        },
    }),
}));

describe('PaginationControls', () => {
  it('renders totals and handles page size change', () => {
    const onPageChange = vi.fn();
    const onPageSizeChange = vi.fn();
    render(<PaginationControls page={1} pageSize={20} total={35} onPageChange={onPageChange} onPageSizeChange={onPageSizeChange} />);

    expect(screen.getByText('Total: 35')).toBeInTheDocument();

    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('20');
    fireEvent.change(select, { target: { value: '50' } });
    expect(onPageSizeChange).toHaveBeenCalledWith(50);
  });

  it('disables Prev on first page and enables Next', () => {
    const onPageChange = vi.fn();
    const onPageSizeChange = vi.fn();
    render(<PaginationControls page={1} pageSize={20} total={35} onPageChange={onPageChange} onPageSizeChange={onPageSizeChange} />);

    const prev = screen.getByText('Prev') as HTMLButtonElement;
    const next = screen.getByText('Next') as HTMLButtonElement;
    expect(prev).toBeDisabled();
    expect(next).not.toBeDisabled();

    fireEvent.click(next);
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('enables Prev when page > 1 and calls onPageChange with correct page', () => {
    const onPageChange = vi.fn();
    const onPageSizeChange = vi.fn();
    render(<PaginationControls page={2} pageSize={10} total={100} onPageChange={onPageChange} onPageSizeChange={onPageSizeChange} />);

    const prev = screen.getByText('Prev') as HTMLButtonElement;
    expect(prev).not.toBeDisabled();
    fireEvent.click(prev);
    expect(onPageChange).toHaveBeenCalledWith(1);
  });
});
