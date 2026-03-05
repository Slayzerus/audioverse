import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';

vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (key: string, fallback?: string) => fallback ?? key }),
}));

const mockLists = [
    {
        id: 1, name: 'Weekend Events', description: 'Fun stuff',
        type: 0, visibility: 0, isPinned: false, sortOrder: 0, itemCount: 3,
    },
    {
        id: 2, name: 'Favorites', description: '',
        type: 1, visibility: 1, isPinned: true, sortOrder: 1, itemCount: 5,
    },
];

vi.mock('../scripts/api/apiEventLists', () => ({
    EventListType: { Custom: 0, Favorites: 1, Watched: 2, ByLocation: 3, ByCategory: 4, Archive: 5 },
    EventListVisibility: { Private: 0, Shared: 1, Public: 2 },
    useMyEventListsQuery: () => ({ data: mockLists, isLoading: false }),
    usePublicEventListsQuery: () => ({
        data: { items: [{ id: 10, name: 'Public Games', type: 0, visibility: 2, isPinned: false, sortOrder: 0, itemCount: 7 }], totalCount: 1, page: 1, pageSize: 20 },
        isLoading: false,
    }),
    useCreateEventListMutation: () => ({ mutate: vi.fn() }),
    useUpdateEventListMutation: () => ({ mutate: vi.fn() }),
    useDeleteEventListMutation: () => ({ mutate: vi.fn() }),
    useAddEventToListMutation: () => ({ mutate: vi.fn() }),
    useRemoveEventListItemMutation: () => ({ mutate: vi.fn() }),
    useUpdateEventListItemMutation: () => ({ mutate: vi.fn() }),
    useToggleFavoriteMutation: () => ({ mutate: vi.fn() }),
    useEventListByIdQuery: () => ({ data: null, isLoading: false }),
    useMoveEventsMutation: () => ({ mutate: vi.fn() }),
    useCopyEventsMutation: () => ({ mutate: vi.fn() }),
    useReorderEventListItemsMutation: () => ({ mutate: vi.fn() }),
}));

vi.mock('../scripts/api/apiEventSubscriptions', () => ({
    useSetObservedMutation: () => ({ mutate: vi.fn() }),
}));

import EventListsPage from '../pages/party/EventListsPage';

describe('EventListsPage', () => {
    it('renders page title', () => {
        render(<EventListsPage />);
        expect(screen.getByText('My Event Lists')).toBeDefined();
    });

    it('shows "Create new list" button', () => {
        render(<EventListsPage />);
        expect(screen.getByText(/Create new list/)).toBeDefined();
    });

    it('renders list cards from mock data', () => {
        render(<EventListsPage />);
        expect(screen.getByText('Weekend Events')).toBeDefined();
        expect(screen.getAllByText('Favorites').length).toBeGreaterThan(0);
    });

    it('shows public lists section', () => {
        render(<EventListsPage />);
        expect(screen.getByText('Public Lists')).toBeDefined();
        expect(screen.getByText('Public Games')).toBeDefined();
    });
});
