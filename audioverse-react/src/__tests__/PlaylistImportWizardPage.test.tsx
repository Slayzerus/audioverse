import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (key: string, fallback?: string) => fallback ?? key }),
}));

vi.mock('../scripts/api/apiPlaylistManager', () => ({
    useServiceConnectionsQuery: () => ({ data: [], refetch: vi.fn() }),
    useConnectServiceMutation: () => ({ mutate: vi.fn(), isPending: false }),
    useDisconnectServiceMutation: () => ({ mutate: vi.fn(), isPending: false }),
    useExternalPlaylistsQuery: () => ({ data: [], isLoading: false }),
    useExternalPlaylistTracksQuery: () => ({ data: [], isLoading: false }),
    useImportExternalPlaylistMutation: () => ({ mutate: vi.fn(), isPending: false, isSuccess: false }),
}));

vi.mock('../models/modelsMusicPlatform', () => ({
    MusicPlatform: { None: 0, Spotify: 1, Tidal: 2, YouTube: 4, All: 7 },
}));

import PlaylistImportWizardPage from '../pages/enjoy/PlaylistImportWizardPage';

const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <MemoryRouter>{children}</MemoryRouter>
);

describe('PlaylistImportWizardPage', () => {
    it('renders page title', () => {
        render(<PlaylistImportWizardPage />, { wrapper: Wrapper });
        expect(screen.getByText(/Import playlists from music services/)).toBeDefined();
    });

    it('renders step indicators', () => {
        render(<PlaylistImportWizardPage />, { wrapper: Wrapper });
        expect(screen.getByText(/Connect service/)).toBeDefined();
        expect(screen.getByText(/Choose playlist/)).toBeDefined();
    });

    it('renders platform buttons', () => {
        render(<PlaylistImportWizardPage />, { wrapper: Wrapper });
        expect(screen.getByText(/Spotify/)).toBeDefined();
        expect(screen.getByText(/Tidal/)).toBeDefined();
        expect(screen.getByText(/YouTube Music/)).toBeDefined();
    });

    it('starts at step 1', () => {
        render(<PlaylistImportWizardPage />, { wrapper: Wrapper });
        // Step 1 is Connect — platform selection section should be visible
        expect(screen.getByText(/Choose music service/)).toBeDefined();
    });
});
