import { describe, it, expect, vi, beforeAll } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import KaraokeStatsPage from '../pages/dashboard/KaraokeStatsPage';

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
    if (typeof globalThis.ResizeObserver === 'undefined') {
        globalThis.ResizeObserver = class ResizeObserver {
            observe() { /* noop */ }
            unobserve() { /* noop */ }
            disconnect() { /* noop */ }
        } as unknown as typeof globalThis.ResizeObserver;
    }
});

// ── Mocks ──
vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (_key: string, fallback?: string) => fallback ?? _key }),
}));

let mockUser = { isAuthenticated: true, userId: 1 };
vi.mock('../contexts/UserContext', () => ({
    useUser: () => mockUser,
}));

const mockRanking = [
    { userId: 1, username: 'Alice', totalScore: 5000, songsSung: 10, bestScore: 900 },
    { userId: 2, username: 'Bob', totalScore: 3000, songsSung: 8, bestScore: 700 },
    { userId: 3, username: 'Charlie', totalScore: 2000, songsSung: 5, bestScore: 600 },
];
const mockHistory = [
    { singingId: 1, songTitle: 'Bohemian Rhapsody', score: 850, performedAt: '2026-02-10T10:00:00' },
    { singingId: 2, songTitle: 'Stairway to Heaven', score: 900, performedAt: '2026-02-11T10:00:00' },
];
const mockActivity = [
    { date: '2026-02-10', songsSung: 3, totalScore: 2400 },
    { date: '2026-02-11', songsSung: 2, totalScore: 1800 },
];

let mockApiState = { ranking: mockRanking, history: mockHistory, activity: mockActivity, loading: false };

vi.mock('../scripts/api/apiKaraoke', () => ({
    useRankingQuery: () => ({ data: mockApiState.ranking, isLoading: mockApiState.loading }),
    useUserHistoryQuery: () => ({ data: mockApiState.history, isLoading: mockApiState.loading }),
    useActivityQuery: () => ({ data: mockApiState.activity, isLoading: mockApiState.loading }),
}));

vi.mock('../contexts/GamepadNavigationContext', () => ({
    useGamepadNavigation: () => ({ register: () => () => {}, unregister: () => {}, activeId: null, setActive: () => {}, pushFocusTrap: () => {}, popFocusTrap: () => {} }),
    GamepadNavigationProvider: ({ children }: any) => children,
}));

// Recharts ResponsiveContainer needs real DOM measurements — mock it
vi.mock('recharts', async () => {
    const actual = await vi.importActual<typeof import('recharts')>('recharts');
    return {
        ...actual,
        ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="responsive-container">{children}</div>,
    };
});

const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <MemoryRouter>{children}</MemoryRouter>
);

describe('KaraokeStatsPage', () => {
    it('renders the title', () => {
        render(<KaraokeStatsPage />, { wrapper: Wrapper });
        expect(screen.getByText('Karaoke Stats')).toBeInTheDocument();
    });

    it('shows summary stat cards with computed values', () => {
        render(<KaraokeStatsPage />, { wrapper: Wrapper });
        // totalSongs = 3 + 2 = 5 (may appear in stat card + ranking table)
        expect(screen.getAllByText('5').length).toBeGreaterThanOrEqual(1);
        // bestScore = 900 (stat card)
        expect(screen.getAllByText('900').length).toBeGreaterThanOrEqual(1);
        // rank = #1 (stat card)
        expect(screen.getByText('#1')).toBeInTheDocument();
    });

    it('renders ranking table with entries', () => {
        render(<KaraokeStatsPage />, { wrapper: Wrapper });
        expect(screen.getByText('Alice')).toBeInTheDocument();
        expect(screen.getByText('Bob')).toBeInTheDocument();
        expect(screen.getByText('Charlie')).toBeInTheDocument();
    });

    it('highlights current user in ranking with "You" badge', () => {
        render(<KaraokeStatsPage />, { wrapper: Wrapper });
        expect(screen.getByText('You')).toBeInTheDocument();
    });

    it('shows login message when not authenticated', () => {
        mockUser = { isAuthenticated: false, userId: null as any };
        render(<KaraokeStatsPage />, { wrapper: Wrapper });
        expect(screen.getByText('Please log in to see your karaoke statistics.')).toBeInTheDocument();
        mockUser = { isAuthenticated: true, userId: 1 };
    });

    it('shows spinner when loading', () => {
        mockApiState = { ...mockApiState, loading: true };
        const { container } = render(<KaraokeStatsPage />, { wrapper: Wrapper });
        expect(container.querySelector('.spinner-border')).toBeInTheDocument();
        mockApiState = { ranking: mockRanking, history: mockHistory, activity: mockActivity, loading: false };
    });

    it('shows empty messages when no data', () => {
        mockApiState = { ranking: [], history: [], activity: [], loading: false };
        render(<KaraokeStatsPage />, { wrapper: Wrapper });
        expect(screen.getByText('No activity data yet. Start singing!')).toBeInTheDocument();
        expect(screen.getByText('No singing history yet.')).toBeInTheDocument();
        expect(screen.getByText('No ranking data yet.')).toBeInTheDocument();
        mockApiState = { ranking: mockRanking, history: mockHistory, activity: mockActivity, loading: false };
    });

    it('renders chart containers when data exists', () => {
        render(<KaraokeStatsPage />, { wrapper: Wrapper });
        const containers = screen.getAllByTestId('responsive-container');
        expect(containers.length).toBe(2); // line chart + bar chart
    });

    it('has back link to dashboard and XP & Skills link', () => {
        render(<KaraokeStatsPage />, { wrapper: Wrapper });
        const links = screen.getAllByRole('link');
        const backLink = links.find(l => l.getAttribute('href') === '/dashboard');
        const progressLink = links.find(l => l.getAttribute('href') === '/progress');
        expect(backLink).toBeInTheDocument();
        expect(progressLink).toBeInTheDocument();
    });

    it('renders section titles', () => {
        render(<KaraokeStatsPage />, { wrapper: Wrapper });
        expect(screen.getByText('Activity (last 30 days)')).toBeInTheDocument();
        expect(screen.getByText('Recent Scores (last 20)')).toBeInTheDocument();
        expect(screen.getByText('Top 10 Ranking')).toBeInTheDocument();
    });
});
