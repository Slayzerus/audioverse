import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (key: string, fallback?: string) => fallback ?? key }),
}));

const mockParty = { id: 1, title: 'Test Event', name: 'Test', description: 'A test event', startTime: '2026-01-01T18:00:00', endTime: '2026-01-01T23:00:00', locationName: 'Club XYZ' };
vi.mock('../scripts/api/apiKaraoke', () => ({
    usePartyQuery: () => ({ data: mockParty, isLoading: false }),
}));
vi.mock('../scripts/api/apiEventPhotos', () => ({
    useEventPhotosQuery: () => ({ data: { items: [{ id: 1, url: '/img.jpg', caption: 'Photo 1' }] }, isLoading: false }),
}));
vi.mock('../scripts/api/apiEventComments', () => ({
    useEventCommentsQuery: () => ({ data: [{ id: 1, text: 'Great event!', authorName: 'Alice', createdAt: '2026-01-02T10:00:00' }], isLoading: false }),
}));
vi.mock('../scripts/api/apiEventPolls', () => ({
    usePollsQuery: () => ({ data: [{ id: 1, question: 'Best song?', options: [{ id: 1, text: 'Song A', votesCount: 5 }] }], isLoading: false }),
}));
vi.mock('../scripts/api/apiEventBilling', () => ({
    useExpensesQuery: () => ({ data: [{ id: 1, description: 'Drinks', amount: 50, paidByName: 'Bob' }], isLoading: false }),
    useSettlementQuery: () => ({ data: { transfers: [] }, isLoading: false }),
}));

const noopMut = { mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false };
vi.mock('../scripts/api/apiEventSubscriptions', () => ({
    EventNotificationLevel: { Muted: 0, Essential: 1, Standard: 2, All: 3 },
    EventNotificationCategory: { Cancellation: 1, DateTimeChange: 2, Reminder24h: 4, Reminder1h: 8, ScheduleUpdate: 16, NewParticipant: 32, News: 64, Comments: 128, Polls: 256, Media: 512, GameUpdates: 1024 },
    useSubscriptionCheckQuery: () => ({ data: false, isLoading: false }),
    useEventSubscriptionQuery: () => ({ data: null, isLoading: false }),
    useSubscribeToEventMutation: () => noopMut,
    useUnsubscribeMutation: () => noopMut,
    useEventSubscribersQuery: () => ({ data: [], isLoading: false }),
}));
vi.mock('../scripts/api/apiEventLists', () => ({
    useMyEventListsQuery: () => ({ data: [], isLoading: false }),
    useEventExistsInListQuery: () => ({ data: false, isLoading: false }),
    useAddEventToListMutation: () => noopMut,
}));

import EventDetailPage from '../pages/party/EventDetailPage';

const renderPage = (partyId = '1') =>
    render(
        <MemoryRouter initialEntries={[`/parties/${partyId}/details`]}>
            <Routes>
                <Route path="/parties/:partyId/details" element={<EventDetailPage />} />
            </Routes>
        </MemoryRouter>
    );

describe('EventDetailPage', () => {
    it('renders event title', () => {
        renderPage();
        expect(screen.getByText('Test Event')).toBeDefined();
    });

    it('renders overview tab by default', () => {
        renderPage();
        expect(screen.getByText('A test event')).toBeDefined();
    });

    it('renders location name', () => {
        renderPage();
        expect(screen.getByText(/Club XYZ/)).toBeDefined();
    });

    it('renders tab buttons', () => {
        renderPage();
        expect(screen.getAllByText(/Overview/).length).toBeGreaterThan(0);
        expect(screen.getByText(/Photos/)).toBeDefined();
        expect(screen.getByText(/Comments/)).toBeDefined();
    });

    it('renders back link', () => {
        renderPage();
        const link = screen.getByText(/Back to event/);
        expect(link).toBeDefined();
        expect(link.closest('a')).toBeDefined();
    });
});
