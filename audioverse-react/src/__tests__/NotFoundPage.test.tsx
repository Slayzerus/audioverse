import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NotFoundPage from '../pages/NotFoundPage';

vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (key: string, fallback?: string) => fallback ?? key }),
}));

describe('NotFoundPage', () => {
    const renderPage = () =>
        render(
            <MemoryRouter>
                <NotFoundPage />
            </MemoryRouter>
        );

    it('shows 404 heading', () => {
        renderPage();
        expect(screen.getByText('404')).toBeDefined();
    });

    it('shows title', () => {
        renderPage();
        expect(screen.getByText('Page not found')).toBeDefined();
    });

    it('shows description', () => {
        renderPage();
        expect(screen.getByText(/doesn't exist or has been moved/)).toBeDefined();
    });

    it('has alert role', () => {
        renderPage();
        expect(screen.getByRole('alert')).toBeDefined();
    });

    it('renders go home link', () => {
        renderPage();
        const link = screen.getByRole('link', { name: 'Go to homepage' });
        expect(link).toBeDefined();
        expect(link.getAttribute('href')).toBe('/');
    });
});
