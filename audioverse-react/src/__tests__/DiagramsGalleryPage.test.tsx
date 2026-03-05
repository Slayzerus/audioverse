import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DiagramsGalleryPage from '../pages/admin/DiagramsGalleryPage';

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

vi.mock('../contexts/GamepadNavigationContext', () => ({
    useGamepadNavigation: () => ({ register: () => () => {}, unregister: () => {}, activeId: null, setActive: () => {}, pushFocusTrap: () => {}, popFocusTrap: () => {} }),
    GamepadNavigationProvider: ({ children }: any) => children,
}));

/* ─────────────────────────────────────────────────────────── */

const renderPage = () => render(
    <MemoryRouter initialEntries={['/admin/diagram-gallery']}>
        <DiagramsGalleryPage />
    </MemoryRouter>
);

describe('DiagramsGalleryPage', () => {
    it('renders the page header', () => {
        renderPage();
        expect(screen.getByText('Diagrams Gallery')).toBeInTheDocument();
        expect(screen.getByText(/Browse all architecture/)).toBeInTheDocument();
    });

    it('renders all 16 diagram cards', () => {
        renderPage();
        // 12 backend + 4 frontend = 16
        const cards = screen.getAllByTestId(/^diagram-card-/);
        expect(cards).toHaveLength(16);
    });

    it('shows correct category counts', () => {
        renderPage();
        expect(screen.getByText(/12 Backend/)).toBeInTheDocument();
        expect(screen.getByText(/4 Frontend/)).toBeInTheDocument();
        expect(screen.getByText(/16 Total/)).toBeInTheDocument();
    });

    it('displays backend diagram titles', () => {
        renderPage();
        expect(screen.getByText(/System Architecture/)).toBeInTheDocument();
        expect(screen.getByText(/Core Data Model/)).toBeInTheDocument();
        expect(screen.getByText(/CQRS Architecture/)).toBeInTheDocument();
        expect(screen.getByText(/Docker Containers/)).toBeInTheDocument();
    });

    it('displays frontend diagram titles', () => {
        renderPage();
        expect(screen.getByText(/Frontend Architecture/)).toBeInTheDocument();
        expect(screen.getByText(/Karaoke Data Flow/)).toBeInTheDocument();
        expect(screen.getByText(/Game State Management/)).toBeInTheDocument();
        expect(screen.getByText(/Routing Structure/)).toBeInTheDocument();
    });

    it('filters to backend only', () => {
        renderPage();
        fireEvent.click(screen.getByTestId('filter-backend'));
        const cards = screen.getAllByTestId(/^diagram-card-/);
        expect(cards).toHaveLength(12);
        // Frontend cards should not be present
        expect(screen.queryByText(/Routing Structure/)).toBeNull();
    });

    it('filters to frontend only', () => {
        renderPage();
        fireEvent.click(screen.getByTestId('filter-frontend'));
        const cards = screen.getAllByTestId(/^diagram-card-/);
        expect(cards).toHaveLength(4);
        // Backend cards should not be present
        expect(screen.queryByText(/01. System Architecture/)).toBeNull();
    });

    it('shows all when "All" filter clicked after filtering', () => {
        renderPage();
        fireEvent.click(screen.getByTestId('filter-frontend'));
        expect(screen.getAllByTestId(/^diagram-card-/)).toHaveLength(4);
        fireEvent.click(screen.getByTestId('filter-all'));
        expect(screen.getAllByTestId(/^diagram-card-/)).toHaveLength(16);
    });

    it('searches diagrams by title', () => {
        renderPage();
        const searchInput = screen.getByTestId('diagram-search');
        fireEvent.change(searchInput, { target: { value: 'karaoke' } });
        const cards = screen.getAllByTestId(/^diagram-card-/);
        // Should match: "Event Lifecycle" (03, desc mentions karaoke rounds), "Karaoke Session Flow" (09), "Karaoke Data Flow" (f2)
        expect(cards).toHaveLength(3);
    });

    it('searches diagrams by description', () => {
        renderPage();
        const searchInput = screen.getByTestId('diagram-search');
        fireEvent.change(searchInput, { target: { value: 'WebSocket' } });
        const cards = screen.getAllByTestId(/^diagram-card-/);
        expect(cards).toHaveLength(1);
        expect(screen.getByText(/SignalR Real-Time/)).toBeInTheDocument();
    });

    it('shows no-results message for empty search', () => {
        renderPage();
        const searchInput = screen.getByTestId('diagram-search');
        fireEvent.change(searchInput, { target: { value: 'zzzznonexistent' } });
        expect(screen.queryAllByTestId(/^diagram-card-/)).toHaveLength(0);
        expect(screen.getByText('No diagrams match your search.')).toBeInTheDocument();
    });

    it('opens preview overlay on card click', () => {
        renderPage();
        const card = screen.getByTestId('diagram-card-f1');
        fireEvent.click(card);
        expect(screen.getByTestId('diagram-preview-overlay')).toBeInTheDocument();
        expect(screen.getByTestId('diagram-close-btn')).toBeInTheDocument();
    });

    it('shows iframe for frontend diagram preview', () => {
        renderPage();
        fireEvent.click(screen.getByTestId('diagram-card-f1'));
        expect(screen.getByTestId('diagram-iframe')).toBeInTheDocument();
        expect(screen.getByTestId('diagram-external-link')).toBeInTheDocument();
    });

    it('shows backend-only message for backend diagram preview', () => {
        renderPage();
        fireEvent.click(screen.getByTestId('diagram-card-01'));
        expect(screen.getByText(/This diagram is located in the backend repository/)).toBeInTheDocument();
        expect(screen.queryByTestId('diagram-iframe')).toBeNull();
    });

    it('closes preview overlay', () => {
        renderPage();
        fireEvent.click(screen.getByTestId('diagram-card-f1'));
        expect(screen.getByTestId('diagram-preview-overlay')).toBeInTheDocument();
        fireEvent.click(screen.getByTestId('diagram-close-btn'));
        expect(screen.queryByTestId('diagram-preview-overlay')).toBeNull();
    });

    it('has back link to admin', () => {
        renderPage();
        expect(screen.getByText('Back to Admin')).toBeInTheDocument();
    });

    it('combines filter and search', () => {
        renderPage();
        fireEvent.click(screen.getByTestId('filter-backend'));
        const searchInput = screen.getByTestId('diagram-search');
        fireEvent.change(searchInput, { target: { value: 'auth' } });
        const cards = screen.getAllByTestId(/^diagram-card-/);
        expect(cards).toHaveLength(1);
        expect(screen.getByText(/Auth & JWT Flow/)).toBeInTheDocument();
    });
});
