import { describe, it, expect, vi, beforeAll } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import HomePage from '../pages/HomePage';
import { MemoryRouter } from 'react-router-dom';

// framer-motion whileInView needs IntersectionObserver
beforeAll(() => {
    if (typeof globalThis.IntersectionObserver === 'undefined') {
        globalThis.IntersectionObserver = class IntersectionObserver {
            readonly root: Element | null = null;
            readonly rootMargin: string = '';
            readonly thresholds: ReadonlyArray<number> = [];
            observe() { /* noop */ }
            unobserve() { /* noop */ }
            disconnect() { /* noop */ }
            takeRecords(): IntersectionObserverEntry[] { return []; }
        } as unknown as typeof globalThis.IntersectionObserver;
    }
});

vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (key: string, fallback?: string) => fallback ?? key }),
}));

vi.mock('../contexts/UserContext', () => ({
    useUser: () => ({ isAuthenticated: false, userId: null }),
}));

vi.mock('../scripts/api/apiKaraoke', () => ({
    usePartiesQuery: () => ({ data: [], isLoading: false }),
    useRankingQuery: () => ({ data: [], isLoading: false }),
    useActivityQuery: () => ({ data: [], isLoading: false }),
}));

vi.mock('../contexts/GamepadNavigationContext', () => ({
    useGamepadNavigation: () => ({ register: () => () => {}, unregister: () => {}, activeId: null, setActive: () => {}, pushFocusTrap: () => {}, popFocusTrap: () => {} }),
    GamepadNavigationProvider: ({ children }: any) => children,
}));

const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <MemoryRouter>{children}</MemoryRouter>
);

describe('HomePage', () => {
    it('renders lead text', () => {
        render(<HomePage />, { wrapper: Wrapper });
        expect(screen.getByText('homePage.lead')).toBeDefined();
    });

    it('renders secondary text', () => {
        render(<HomePage />, { wrapper: Wrapper });
        expect(screen.getByText('homePage.secondary')).toBeDefined();
    });

    it('renders sign up button when not authenticated', () => {
        render(<HomePage />, { wrapper: Wrapper });
        expect(screen.getByText('nav.signUp')).toBeDefined();
    });

    it('renders sign in button when not authenticated', () => {
        render(<HomePage />, { wrapper: Wrapper });
        expect(screen.getByText('nav.signIn')).toBeDefined();
    });

    it('renders AudioVerse brand', () => {
        render(<HomePage />, { wrapper: Wrapper });
        expect(screen.getByText('Audio')).toBeDefined();
        expect(screen.getByText('Verse')).toBeDefined();
    });
});
