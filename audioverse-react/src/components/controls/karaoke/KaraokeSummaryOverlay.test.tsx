/**
 * Tests for KaraokeSummaryOverlay — multi-player score bars & rankings
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

/* ── Mocks ── */
vi.mock('../../../scripts/api/apiKaraoke', () => ({
    fetchTopSingings: vi.fn(() => Promise.resolve([])),
}));

vi.mock('../../common/Focusable', () => ({
    Focusable: ({ children, id }: { children: React.ReactNode; id: string }) => (
        <div data-testid={`focusable-${id}`}>{children}</div>
    ),
}));

import KaraokeSummaryOverlay, { type PlayerScoreEntry } from './KaraokeSummaryOverlay';
import type { KaraokeSongFile } from '../../../models/modelsKaraoke';
import type { TopSinging } from '../../../scripts/api/apiKaraoke';

/* ── Helpers ── */
const t = ((key: string) => key) as unknown as import('i18next').TFunction;

const mockSong: KaraokeSongFile = {
    id: 1,
    title: 'Test Song',
    artist: 'Test Artist',
    filePath: '/songs/test.txt',
} as unknown as KaraokeSongFile;

const players: PlayerScoreEntry[] = [
    { id: 1, name: 'Alice', color: '#ff0000', classicScore: 8500, bonusScore: 600, totalScore: 9100 },
    { id: 2, name: 'Bob', color: '#00ff00', classicScore: 7200, bonusScore: 300, totalScore: 7500 },
    { id: 3, name: 'Charlie', color: '#0000ff', classicScore: 5000, bonusScore: 0, totalScore: 5000 },
];

const topSingings: TopSinging[] = [
    { singingId: 1, roundId: 1, playerId: 1, playerName: 'Pro', score: 9800 } as TopSinging,
    { singingId: 2, roundId: 1, playerId: 2, playerName: 'Ace', score: 9500 } as TopSinging,
];

beforeEach(() => {
    vi.clearAllMocks();
    // Mock requestAnimationFrame to be a no-op (prevents infinite loop in ScoreBar)
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 0);
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
});

/* ── Tests ── */
describe('KaraokeSummaryOverlay', () => {
    it('renders song title', () => {
        render(
            <KaraokeSummaryOverlay
                uploadedSong={mockSong}
                playerScores={players}
                topSingings={[]}
                onRestart={vi.fn()}
                onContinue={vi.fn()}
                t={t}
            />,
        );
        expect(screen.getByText('Test Artist — Test Song')).toBeDefined();
    });

    it('renders all player names', () => {
        render(
            <KaraokeSummaryOverlay
                uploadedSong={mockSong}
                playerScores={players}
                topSingings={[]}
                onRestart={vi.fn()}
                onContinue={vi.fn()}
                t={t}
            />,
        );
        expect(screen.getByText('Alice')).toBeDefined();
        expect(screen.getByText('Bob')).toBeDefined();
        expect(screen.getByText('Charlie')).toBeDefined();
    });

    it('renders medals for top 3 players', () => {
        const { container } = render(
            <KaraokeSummaryOverlay
                uploadedSong={mockSong}
                playerScores={players}
                topSingings={[]}
                onRestart={vi.fn()}
                onContinue={vi.fn()}
                t={t}
            />,
        );
        expect(container.textContent).toContain('🥇');
        expect(container.textContent).toContain('🥈');
        expect(container.textContent).toContain('🥉');
    });

    it('calls onRestart when restart button clicked', () => {
        const onRestart = vi.fn();
        render(
            <KaraokeSummaryOverlay
                uploadedSong={mockSong}
                playerScores={players}
                topSingings={[]}
                onRestart={onRestart}
                onContinue={vi.fn()}
                t={t}
            />,
        );
        // Find the restart button by translation key
        const restartBtn = screen.getByText('karaokeSummary.restart');
        fireEvent.click(restartBtn);
        expect(onRestart).toHaveBeenCalledOnce();
    });

    it('calls onContinue when continue button clicked', () => {
        const onContinue = vi.fn();
        render(
            <KaraokeSummaryOverlay
                uploadedSong={mockSong}
                playerScores={players}
                topSingings={[]}
                onRestart={vi.fn()}
                onContinue={onContinue}
                t={t}
            />,
        );
        const continueBtn = screen.getByText('karaokeSummary.continue');
        fireEvent.click(continueBtn);
        expect(onContinue).toHaveBeenCalledOnce();
    });

    it('handles empty player scores gracefully', () => {
        const { container } = render(
            <KaraokeSummaryOverlay
                uploadedSong={mockSong}
                playerScores={[]}
                topSingings={[]}
                onRestart={vi.fn()}
                onContinue={vi.fn()}
                t={t}
            />,
        );
        // Should still render without errors
        expect(container).toBeDefined();
    });

    it('handles single player', () => {
        render(
            <KaraokeSummaryOverlay
                uploadedSong={mockSong}
                playerScores={[players[0]]}
                topSingings={[]}
                onRestart={vi.fn()}
                onContinue={vi.fn()}
                t={t}
            />,
        );
        expect(screen.getByText('Alice')).toBeDefined();
        // First place medal
        expect(screen.getByText('🥇')).toBeDefined();
    });

    it('displays global top singings', () => {
        render(
            <KaraokeSummaryOverlay
                uploadedSong={mockSong}
                playerScores={players}
                topSingings={topSingings}
                onRestart={vi.fn()}
                onContinue={vi.fn()}
                t={t}
            />,
        );
        expect(screen.getByText('Pro')).toBeDefined();
        expect(screen.getByText('Ace')).toBeDefined();
    });

    it('exports PlayerScoreEntry type', () => {
        const entry: PlayerScoreEntry = {
            id: 1,
            name: 'Test',
            color: '#fff',
            classicScore: 100,
            bonusScore: 50,
            totalScore: 150,
        };
        expect(entry.totalScore).toBe(150);
    });

    it('handles null uploadedSong', () => {
        const { container } = render(
            <KaraokeSummaryOverlay
                uploadedSong={null}
                playerScores={players}
                topSingings={[]}
                onRestart={vi.fn()}
                onContinue={vi.fn()}
                t={t}
            />,
        );
        expect(container).toBeDefined();
    });
});
