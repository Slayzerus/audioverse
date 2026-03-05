import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (key: string, fallback?: string) => fallback ?? key }),
}));

vi.mock('../scripts/api/apiBggCatalog', () => ({
    useBggSyncStatusQuery: () => ({
        data: { state: 'Idle', totalGames: 200, syncedGames: 200, failedGames: 0, progress: 1 },
        isLoading: false,
    }),
    useStartBggSyncMutation: () => ({ mutate: vi.fn() }),
    useCancelBggSyncMutation: () => ({ mutate: vi.fn() }),
    useBggCatalogSearchQuery: () => ({ data: [], isLoading: false }),
    useBggExportQuery: () => ({ data: [], isLoading: false }),
    useImportBggCatalogMutation: () => ({ mutate: vi.fn() }),
}));

vi.mock('../scripts/api/apiBookCatalog', () => ({
    useBookSearchQuery: () => ({ data: [], isLoading: false }),
    useBookExportQuery: () => ({ data: [], isLoading: false }),
    useImportBookCatalogMutation: () => ({ mutate: vi.fn() }),
}));

vi.mock('../components/common/ContentSkeleton', () => ({
    default: () => <div data-testid="skeleton">Loading...</div>,
}));

import AdminIntegrationsPage from '../pages/admin/AdminIntegrationsPage';

describe('AdminIntegrationsPage', () => {
    it('renders page title', () => {
        render(<AdminIntegrationsPage />);
        expect(screen.getByText(/Integrations/)).toBeDefined();
    });

    it('shows BGG tab by default', () => {
        render(<AdminIntegrationsPage />);
        expect(screen.getByText('BGG Sync')).toBeDefined();
    });

    it('shows sync status card with state badge', () => {
        render(<AdminIntegrationsPage />);
        expect(screen.getByText('Idle')).toBeDefined();
    });

    it('shows sync stats', () => {
        render(<AdminIntegrationsPage />);
        expect(screen.getAllByText(/200/).length).toBeGreaterThan(0);
    });

    it('can switch to Books tab', () => {
        render(<AdminIntegrationsPage />);
        const booksTab = screen.getByText(/Ksi\u0105\u017cki/);
        fireEvent.click(booksTab);
        // After switching, BGG Sync card should not be present
        expect(screen.queryByText('BGG Sync')).toBeNull();
    });
});
