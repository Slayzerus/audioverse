import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import EventCalendarPage from '../pages/dashboard/EventCalendarPage';

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

// Generate events at known dates relative to "today"
const today = new Date();
const todayISO = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 18, 0, 0).toISOString();
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);
const tomorrowISO = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 20, 0, 0).toISOString();

const mockEvents = [
    { id: 1, title: 'Karaoke Night', startTime: todayISO, endTime: null, status: 2, locationName: 'Club XYZ', type: 1 },
    { id: 2, title: 'Game Night', startTime: tomorrowISO, endTime: null, status: 1, locationName: null, type: 5 },
    { id: 3, title: 'Old Concert', startTime: '2025-01-15T19:00:00', endTime: null, status: 3, locationName: 'Arena', type: 1 },
];

let mockLoading = false;
let mockEventsData = mockEvents;

vi.mock('../scripts/api/apiEvents', () => ({
    useFilteredEventsQuery: () => ({
        data: mockLoading ? undefined : { items: mockEventsData, page: 1, pageSize: 200, totalCount: mockEventsData.length, totalPages: 1 },
        isLoading: mockLoading,
    }),
}));

vi.mock('../contexts/GamepadNavigationContext', () => ({
    useGamepadNavigation: () => ({ register: () => () => {}, unregister: () => {}, activeId: null, setActive: () => {}, pushFocusTrap: () => {}, popFocusTrap: () => {} }),
    GamepadNavigationProvider: ({ children }: any) => children,
}));

const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <MemoryRouter>{children}</MemoryRouter>
);

describe('EventCalendarPage', () => {
    beforeEach(() => {
        mockUser = { isAuthenticated: true, userId: 1 };
        mockLoading = false;
        mockEventsData = mockEvents;
    });

    it('renders the title', () => {
        render(<EventCalendarPage />, { wrapper: Wrapper });
        expect(screen.getByText('Event Calendar')).toBeDefined();
    });

    it('shows current month and year', () => {
        render(<EventCalendarPage />, { wrapper: Wrapper });
        const months = ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"];
        const expected = `${months[today.getMonth()]} ${today.getFullYear()}`;
        expect(screen.getByText(expected)).toBeDefined();
    });

    it('shows day of week headers', () => {
        render(<EventCalendarPage />, { wrapper: Wrapper });
        expect(screen.getByText('Mon')).toBeDefined();
        expect(screen.getByText('Fri')).toBeDefined();
        expect(screen.getByText('Sun')).toBeDefined();
    });

    it('renders event titles on calendar', () => {
        render(<EventCalendarPage />, { wrapper: Wrapper });
        expect(screen.getByText('Karaoke Night')).toBeDefined();
        expect(screen.getAllByText('Game Night').length).toBeGreaterThanOrEqual(1);
    });

    it('shows upcoming events alert', () => {
        render(<EventCalendarPage />, { wrapper: Wrapper });
        expect(screen.getByText('Upcoming this week:')).toBeDefined();
    });

    it('switches to list view', () => {
        render(<EventCalendarPage />, { wrapper: Wrapper });
        const listBtn = screen.getByTitle('List');
        fireEvent.click(listBtn);
        // List view shows table headers
        expect(screen.getByText('Date')).toBeDefined();
        expect(screen.getByText('Event')).toBeDefined();
        expect(screen.getByText('Location')).toBeDefined();
        expect(screen.getByText('Status')).toBeDefined();
    });

    it('shows location in list view', () => {
        render(<EventCalendarPage />, { wrapper: Wrapper });
        const listBtn = screen.getByTitle('List');
        fireEvent.click(listBtn);
        expect(screen.getByText('Club XYZ')).toBeDefined();
    });

    it('shows status badges in list view', () => {
        render(<EventCalendarPage />, { wrapper: Wrapper });
        const listBtn = screen.getByTitle('List');
        fireEvent.click(listBtn);
        expect(screen.getAllByText('Live').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('Planned').length).toBeGreaterThanOrEqual(1);
    });

    it('shows login message when not authenticated', () => {
        mockUser = { isAuthenticated: false, userId: 0 };
        render(<EventCalendarPage />, { wrapper: Wrapper });
        expect(screen.getByText('Please log in to see the event calendar.')).toBeDefined();
    });

    it('shows spinner while loading', () => {
        mockLoading = true;
        const { container } = render(<EventCalendarPage />, { wrapper: Wrapper });
        expect(container.querySelector('.spinner-border')).not.toBeNull();
    });

    it('shows back to dashboard link', () => {
        render(<EventCalendarPage />, { wrapper: Wrapper });
        const backLink = screen.getByTitle('Back');
        expect(backLink).toBeDefined();
        expect(backLink.getAttribute('href')).toBe('/dashboard');
    });

    it('navigates months with prev/next buttons', () => {
        render(<EventCalendarPage />, { wrapper: Wrapper });
        const prevBtn = screen.getByLabelText('Previous month');
        const nextBtn = screen.getByLabelText('Next month');
        expect(prevBtn).toBeDefined();
        expect(nextBtn).toBeDefined();
        // Click next month
        fireEvent.click(nextBtn);
        const months = ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"];
        const nextMonthIdx = (today.getMonth() + 1) % 12;
        const nextYear = today.getMonth() === 11 ? today.getFullYear() + 1 : today.getFullYear();
        expect(screen.getByText(`${months[nextMonthIdx]} ${nextYear}`)).toBeDefined();
    });

    it('has Today button', () => {
        render(<EventCalendarPage />, { wrapper: Wrapper });
        expect(screen.getByText('Today')).toBeDefined();
    });

    it('shows legend with status colors', () => {
        render(<EventCalendarPage />, { wrapper: Wrapper });
        expect(screen.getAllByText('Planned').length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText('Draft')).toBeDefined();
        expect(screen.getByText('Finished')).toBeDefined();
        expect(screen.getByText('Cancelled')).toBeDefined();
    });

    it('shows empty message in list view when no events', () => {
        mockEventsData = [];
        render(<EventCalendarPage />, { wrapper: Wrapper });
        const listBtn = screen.getByTitle('List');
        fireEvent.click(listBtn);
        expect(screen.getByText('No events in this month.')).toBeDefined();
    });
});
