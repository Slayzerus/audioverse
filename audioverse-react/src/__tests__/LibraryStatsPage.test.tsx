import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LibraryStatsPage from '../pages/dashboard/LibraryStatsPage';

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

const mockSongs = [
    { id: 1, title: 'Bohemian Rhapsody', albumId: 1, album: { id: 1, title: 'A Night at the Opera' }, primaryArtistId: 1, primaryArtist: { id: 1, name: 'Queen' }, isrc: 'US1234567890' },
    { id: 2, title: 'Stairway to Heaven', albumId: null, album: null, primaryArtistId: 2, primaryArtist: { id: 2, name: 'Led Zeppelin' }, isrc: null },
    { id: 3, title: 'Unknown Song', albumId: null, album: null, primaryArtistId: null, primaryArtist: null, isrc: null },
];
const mockAlbums = [
    { id: 1, title: 'A Night at the Opera', releaseYear: 1975, coverUrl: 'https://example.com/cover.jpg' },
    { id: 2, title: 'Led Zeppelin IV', releaseYear: null, coverUrl: null },
];
const mockArtists = [
    { id: 1, name: 'Queen' },
    { id: 2, name: 'Led Zeppelin' },
    { id: 3, name: 'Pink Floyd' },
];
const mockAudioFiles = [
    { id: 1, genre: 'Rock', songId: 1 },
    { id: 2, genre: 'Rock', songId: 2 },
    { id: 3, genre: 'Blues', songId: 3 },
    { id: 4, genre: null, songId: null },
];

let mockLoading = false;

vi.mock('../scripts/api/apiLibraryCatalog', () => ({
    useLibrarySongsQuery: () => ({ data: mockLoading ? undefined : mockSongs, isLoading: mockLoading }),
    useLibraryAlbumsQuery: () => ({ data: mockLoading ? undefined : mockAlbums, isLoading: mockLoading }),
    useLibraryArtistsQuery: () => ({ data: mockLoading ? undefined : mockArtists, isLoading: mockLoading }),
    useAudioFilesQuery: () => ({ data: mockLoading ? undefined : mockAudioFiles, isLoading: mockLoading }),
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

describe('LibraryStatsPage', () => {
    beforeEach(() => {
        mockUser = { isAuthenticated: true, userId: 1 };
        mockLoading = false;
    });

    it('renders the title', () => {
        render(<LibraryStatsPage />, { wrapper: Wrapper });
        expect(screen.getByText('Library Stats')).toBeDefined();
    });

    it('shows stat cards with correct counts', () => {
        render(<LibraryStatsPage />, { wrapper: Wrapper });
        // songs=3, albums=2, artists=3, audioFiles=4
        expect(screen.getByText('Songs')).toBeDefined();
        expect(screen.getByText('Albums')).toBeDefined();
        expect(screen.getByText('Artists')).toBeDefined();
        expect(screen.getByText('Audio Files')).toBeDefined();
        expect(screen.getAllByText('3').length).toBeGreaterThanOrEqual(1); // songs + artists
        expect(screen.getAllByText('2').length).toBeGreaterThanOrEqual(1); // albums
        expect(screen.getByText('4')).toBeDefined(); // audio files
    });

    it('shows genre distribution section', () => {
        render(<LibraryStatsPage />, { wrapper: Wrapper });
        expect(screen.getByText('Top Genres')).toBeDefined();
        // genre chart rendered
        expect(screen.getAllByTestId('responsive-container').length).toBeGreaterThanOrEqual(1);
    });

    it('shows missing metadata table', () => {
        render(<LibraryStatsPage />, { wrapper: Wrapper });
        expect(screen.getByText('Missing Metadata')).toBeDefined();
        // song #3 has no artist, songs #2,#3 have no album, songs #2,#3 have no ISRC
        expect(screen.getByText('Songs without artist')).toBeDefined();
        expect(screen.getByText('Songs without album')).toBeDefined();
        expect(screen.getByText('Songs without ISRC')).toBeDefined();
        // album #2 has no cover, album #2 has no year
        expect(screen.getByText('Albums without cover')).toBeDefined();
        expect(screen.getByText('Albums without release year')).toBeDefined();
    });

    it('shows recently added songs table', () => {
        render(<LibraryStatsPage />, { wrapper: Wrapper });
        expect(screen.getByText('Recently Added Songs')).toBeDefined();
        expect(screen.getByText('Bohemian Rhapsody')).toBeDefined();
        expect(screen.getByText('Stairway to Heaven')).toBeDefined();
        expect(screen.getByText('Unknown Song')).toBeDefined();
    });

    it('shows login message when not authenticated', () => {
        mockUser = { isAuthenticated: false, userId: 0 };
        render(<LibraryStatsPage />, { wrapper: Wrapper });
        expect(screen.getByText('Please log in to see library statistics.')).toBeDefined();
    });

    it('shows spinner while loading', () => {
        mockLoading = true;
        const { container } = render(<LibraryStatsPage />, { wrapper: Wrapper });
        expect(container.querySelector('.spinner-border')).not.toBeNull();
    });

    it('shows back to dashboard link', () => {
        render(<LibraryStatsPage />, { wrapper: Wrapper });
        const backLink = screen.getByTitle('Back');
        expect(backLink).toBeDefined();
        expect(backLink.getAttribute('href')).toBe('/dashboard');
    });

    it('renders coverage badges for missing metadata', () => {
        render(<LibraryStatsPage />, { wrapper: Wrapper });
        // Song without artist: 1/3 missing → 67% coverage
        const badges = screen.getAllByText(/%$/);
        expect(badges.length).toBeGreaterThanOrEqual(1);
    });

    it('shows artist names in recent songs', () => {
        render(<LibraryStatsPage />, { wrapper: Wrapper });
        expect(screen.getByText('Queen')).toBeDefined();
        expect(screen.getByText('Led Zeppelin')).toBeDefined();
    });

    it('shows section titles', () => {
        render(<LibraryStatsPage />, { wrapper: Wrapper });
        expect(screen.getByText('Albums by Release Year')).toBeDefined();
        expect(screen.getByText('Top Genres')).toBeDefined();
        expect(screen.getByText('Missing Metadata')).toBeDefined();
        expect(screen.getByText('Recently Added Songs')).toBeDefined();
    });
});
