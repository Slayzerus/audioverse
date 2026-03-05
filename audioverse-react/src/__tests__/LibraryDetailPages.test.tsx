import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (key: string, fallback?: string) => fallback ?? key }),
}));

vi.mock('../scripts/api/apiLibraryCatalog', () => ({
    useLibrarySongQuery: () => ({ data: { id: 1, title: 'Test Song', primaryArtist: { id: 5, name: 'Test Artist' }, album: { id: 10, title: 'Test Album', coverUrl: '/cover.jpg' }, isrc: 'USAT12345678' }, isLoading: false }),
    useSongDetailsQuery: () => ({ data: [{ id: 1, type: 1, content: 'La la la lyrics' }], isLoading: false }),
    useAudioFilesQuery: () => ({ data: [{ id: 1, fileName: 'song.mp3', mimeType: 'audio/mpeg', durationMs: 210000, sampleRate: 44100, channels: 2, fileSize: 5242880 }], isLoading: false }),
    useMediaFilesQuery: () => ({ data: [], isLoading: false }),
    useLibraryAlbumQuery: () => ({ data: { id: 10, title: 'Test Album', releaseYear: 2024, coverUrl: '/cover.jpg', songs: [{ id: 1, title: 'Test Song', trackNumber: 1 }] }, isLoading: false }),
    useLibrarySongsQuery: () => ({ data: [], isLoading: false }),
    useLibraryArtistQuery: () => ({ data: { id: 5, name: 'Test Artist', detail: { imageUrl: '/photo.jpg', bio: 'A great artist', country: 'US' } }, isLoading: false }),
    useArtistFactsQuery: () => ({ data: [], isLoading: false }),
    useLibraryAlbumsQuery: () => ({ data: [], isLoading: false }),
}));

vi.mock('../models/modelsLibrary', () => ({
    SongDetailType: { Lyrics: 1, Credits: 2, Notes: 3, ExternalLink: 4, Misc: 5 },
    ArtistFactType: { BirthDate: 1, DeathDate: 2, Country: 3, Genre: 4, Biography: 5, Website: 6, Misc: 7 },
    AlbumArtistRole: { Primary: 1, Featured: 2, Producer: 3 },
}));

import SongDetailPage from '../pages/explore/SongDetailPage';
import AlbumDetailPage from '../pages/explore/AlbumDetailPage';
import ArtistDetailPage from '../pages/explore/ArtistDetailPage';

describe('SongDetailPage', () => {
    const renderSong = () => render(
        <MemoryRouter initialEntries={['/library-catalog/songs/1']}>
            <Routes><Route path="/library-catalog/songs/:songId" element={<SongDetailPage />} /></Routes>
        </MemoryRouter>
    );

    it('renders song title', () => {
        renderSong();
        expect(screen.getByText(/Test Song/)).toBeDefined();
    });

    it('renders artist name', () => {
        renderSong();
        expect(screen.getByText(/Test Artist/)).toBeDefined();
    });

    it('renders ISRC code', () => {
        renderSong();
        expect(screen.getByText(/USAT12345678/)).toBeDefined();
    });

    it('renders audio files section', () => {
        renderSong();
        expect(screen.getByText(/song\.mp3/)).toBeDefined();
    });

    it('renders back link', () => {
        renderSong();
        expect(screen.getByText(/Back to catalog/)).toBeDefined();
    });
});

describe('AlbumDetailPage', () => {
    const renderAlbum = () => render(
        <MemoryRouter initialEntries={['/library-catalog/albums/10']}>
            <Routes><Route path="/library-catalog/albums/:albumId" element={<AlbumDetailPage />} /></Routes>
        </MemoryRouter>
    );

    it('renders album title', () => {
        renderAlbum();
        expect(screen.getByText(/Test Album/)).toBeDefined();
    });

    it('renders year', () => {
        renderAlbum();
        expect(screen.getByText(/2024/)).toBeDefined();
    });

    it('renders track list', () => {
        renderAlbum();
        expect(screen.getByText(/Test Song/)).toBeDefined();
    });
});

describe('ArtistDetailPage', () => {
    const renderArtist = () => render(
        <MemoryRouter initialEntries={['/library-catalog/artists/5']}>
            <Routes><Route path="/library-catalog/artists/:artistId" element={<ArtistDetailPage />} /></Routes>
        </MemoryRouter>
    );

    it('renders artist name', () => {
        renderArtist();
        expect(screen.getByText(/Test Artist/)).toBeDefined();
    });

    it('renders bio', () => {
        renderArtist();
        expect(screen.getByText('A great artist')).toBeDefined();
    });

    it('renders country', () => {
        renderArtist();
        expect(screen.getByText(/US/)).toBeDefined();
    });
});
