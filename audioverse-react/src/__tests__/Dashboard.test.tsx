import { describe, it, expect, vi, beforeAll } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from '../pages/dashboard/Dashboard';

// ── Polyfills ──
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

// ── Mocks ──
vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (_key: string, fallback?: string) => fallback ?? _key }),
}));

vi.mock('../contexts/UserContext', () => ({
    useUser: () => ({
        isAuthenticated: true,
        userId: 1,
        currentUser: { username: 'TestUser', roles: ['User'] },
        isAdmin: false,
        players: [],
        playerIds: [],
    }),
}));

vi.mock('../scripts/api/apiKaraoke', () => ({
    useRankingQuery: () => ({
        data: [{ userId: 1, username: 'TestUser', totalScore: 5000, songsSung: 10, bestScore: 900 }],
        isLoading: false,
    }),
    useUserHistoryQuery: () => ({
        data: [{ singingId: 1, songTitle: 'Test Song', score: 900, performedAt: '2026-02-11T10:00:00' }],
        isLoading: false,
    }),
    useActivityQuery: () => ({
        data: [{ date: '2026-02-10', songsSung: 5, totalScore: 3000 }],
        isLoading: false,
    }),
}));

vi.mock('../scripts/api/apiUser', () => ({
    useCurrentUserQuery: () => ({ data: { username: 'TestUser', roles: ['User'] }, isLoading: false }),
    default: {
        getAccessToken: () => 'mock-token',
        getCurrentUser: async () => ({ username: 'TestUser', roles: ['User'] }),
    },
}));

vi.mock('../contexts/GamepadNavigationContext', () => ({
    useGamepadNavigation: () => ({ register: () => () => {}, unregister: () => {}, activeId: null, setActive: () => {}, pushFocusTrap: () => {}, popFocusTrap: () => {} }),
    GamepadNavigationProvider: ({ children }: any) => children,
}));

const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <MemoryRouter>{children}</MemoryRouter>
);

describe('Dashboard', () => {
    it('renders the Karaoke Overview section', () => {
        render(<Dashboard />, { wrapper: Wrapper });
        expect(screen.getByText('Karaoke Overview')).toBeInTheDocument();
    });

    it('renders Quick Links section', () => {
        render(<Dashboard />, { wrapper: Wrapper });
        expect(screen.getByText('Quick Links')).toBeInTheDocument();
    });

    it('renders quick link cards', () => {
        render(<Dashboard />, { wrapper: Wrapper });
        expect(screen.getByText('Karaoke')).toBeInTheDocument();
        expect(screen.getByText('Stats')).toBeInTheDocument();
        expect(screen.getByText('Progress')).toBeInTheDocument();
        expect(screen.getByText('Ranking')).toBeInTheDocument();
        expect(screen.getByText('Games')).toBeInTheDocument();
    });

    it('has link to karaoke-stats page', () => {
        render(<Dashboard />, { wrapper: Wrapper });
        const fullStatsLink = screen.getByText('Full Stats').closest('a');
        expect(fullStatsLink).toHaveAttribute('href', '/karaoke-stats');
    });

    it('shows mini karaoke stats', () => {
        render(<Dashboard />, { wrapper: Wrapper });
        // totalSongs from activity mock = 5
        expect(screen.getByText('5')).toBeInTheDocument();
        // bestScore = 900
        expect(screen.getByText('900')).toBeInTheDocument();
        // rank = #1
        expect(screen.getByText('#1')).toBeInTheDocument();
    });

    it('renders logout button area', () => {
        render(<Dashboard />, { wrapper: Wrapper });
        // LogoutButton component is rendered
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBeGreaterThan(0);
    });
});
