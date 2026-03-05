import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (key: string, fallback?: string) => fallback ?? key }),
}));

vi.mock('../scripts/api/apiGames', () => ({
    useSteamCollectionQuery: () => ({ data: [], isLoading: false }),
    useImportSteamBatchMutation: () => ({ mutate: vi.fn(), isPending: false }),
    useImportSteamCollectionMutation: () => ({ mutate: vi.fn(), isPending: false }),
    useUserConnectionsQuery: () => ({ data: [{ platform: 'steam', isConnected: false }], isLoading: false }),
}));

import SteamCollectionImportPage from '../pages/explore/SteamCollectionImportPage';

const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <MemoryRouter>{children}</MemoryRouter>
);

describe('SteamCollectionImportPage', () => {
    it('renders page title', () => {
        render(<SteamCollectionImportPage />, { wrapper: Wrapper });
        expect(screen.getByText(/Steam Collection Import/)).toBeDefined();
    });

    it('renders Steam ID input', () => {
        render(<SteamCollectionImportPage />, { wrapper: Wrapper });
        const input = screen.getByPlaceholderText(/Steam ID/i);
        expect(input).toBeDefined();
    });

    it('renders load collection button', () => {
        render(<SteamCollectionImportPage />, { wrapper: Wrapper });
        expect(screen.getByText('Fetch')).toBeDefined();
    });

    it('renders connection status section', () => {
        render(<SteamCollectionImportPage />, { wrapper: Wrapper });
        expect(screen.getByText(/Steam Connection/)).toBeDefined();
    });
});
