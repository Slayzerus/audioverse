import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';

vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (key: string, fallback?: string) => fallback ?? key }),
}));

vi.mock('../scripts/api/apiBookCatalog', () => ({
    useBookSearchQuery: () => ({ data: undefined, isLoading: false }),
    useBookDetailsQuery: () => ({ data: undefined, isLoading: false }),
}));

vi.mock('../components/common/ContentSkeleton', () => ({
    default: () => <div data-testid="skeleton">Loading...</div>,
}));

import BookCatalogPage from '../pages/explore/BookCatalogPage';

describe('BookCatalogPage', () => {
    it('renders page title', () => {
        render(<BookCatalogPage />);
        expect(screen.getByText(/Book Catalog/)).toBeDefined();
    });

    it('shows search input', () => {
        render(<BookCatalogPage />);
        const input = screen.getByPlaceholderText('Search books by title, author, ISBN...');
        expect(input).toBeDefined();
    });

    it('shows placeholder text when no search', () => {
        render(<BookCatalogPage />);
        expect(screen.getByText('Type at least 2 characters to search...')).toBeDefined();
    });

    it('shows subtitle', () => {
        render(<BookCatalogPage />);
        expect(screen.getByText('Search and browse books')).toBeDefined();
    });
});
