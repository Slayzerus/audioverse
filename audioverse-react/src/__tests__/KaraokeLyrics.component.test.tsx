/**
 * Tests for <KaraokeLyrics /> component
 * Covers: empty song, waiting state, syllable sweep (not-started / partial / fully-sung),
 *         next verse display, active line search logic.
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';

/* ---- mock parseVersesWithSyllables ---- */
const mockParseVersesWithSyllables = vi.fn();

vi.mock('../scripts/karaoke/karaokeLyrics', () => ({
  parseVersesWithSyllables: (...args: any[]) => mockParseVersesWithSyllables(...args),
}));

import KaraokeLyrics from '../components/controls/karaoke/KaraokeLyrics';

beforeEach(() => {
  mockParseVersesWithSyllables.mockReset();
});

const makeSong = (notes: string[] = [], bpm: number | null = 120, gap = 0) => ({
  id: 1,
  songId: 1,
  title: 'Test Song',
  artist: 'Test',
  notes: notes.map(n => ({ noteLine: n })),
  bpm,
  gap,
  videoGap: 0,
}) as any;

/* helper: verse with syllables */
const verse = (ts: number, syls: Array<{ text: string; startTime: number; endTime: number; golden?: boolean; hasTrailingSpace?: boolean }>) => ({
  timestamp: ts,
  text: syls.map(s => s.text).join(' '),
  syllables: syls.map(s => ({
    text: s.text,
    startTime: s.startTime,
    endTime: s.endTime,
    golden: s.golden ?? false,
    hasTrailingSpace: s.hasTrailingSpace ?? true,
  })),
});

describe('KaraokeLyrics component', () => {
  it('shows waiting state for empty song', () => {
    mockParseVersesWithSyllables.mockReturnValue([]);
    const { container } = render(
      <KaraokeLyrics song={makeSong([])} currentTime={0} />,
    );
    expect(container.textContent).toContain('Waiting for lyrics');
  });

  it('shows waiting state when no verse is active', () => {
    mockParseVersesWithSyllables.mockReturnValue([
      verse(10, [{ text: 'Hello', startTime: 10, endTime: 12 }]),
    ]);
    const { container } = render(
      <KaraokeLyrics song={makeSong(['note'])} currentTime={0} />,
    );
    // currentTime=0 is before verse at ts=10 — shows 🎵 (verses exist but not yet active)
    expect(container.textContent).toContain('🎵');
    expect(container.textContent).not.toContain('Waiting for lyrics');
  });

  it('renders current verse syllables when active', () => {
    const verses = [
      verse(0, [
        { text: 'Hel', startTime: 0, endTime: 1 },
        { text: 'lo', startTime: 1, endTime: 2 },
      ]),
    ];
    mockParseVersesWithSyllables.mockReturnValue(verses);
    const { container } = render(
      <KaraokeLyrics song={makeSong(['note'])} currentTime={0.5} />,
    );
    expect(container.textContent).toContain('Hel');
    expect(container.textContent).toContain('lo');
  });

  it('applies fully-sung gradient for past syllables', () => {
    const verses = [
      verse(0, [
        { text: 'Done', startTime: 0, endTime: 1 },
        { text: 'Next', startTime: 1, endTime: 2 },
      ]),
    ];
    mockParseVersesWithSyllables.mockReturnValue(verses);
    const { container } = render(
      <KaraokeLyrics song={makeSong(['note'])} currentTime={1.5} />,
    );
    // First syllable should be fully sung — uses background-clip: text gradient
    const spans = container.querySelectorAll('span');
    const doneSpan = Array.from(spans).find(s => s.textContent?.includes('Done'));
    expect(doneSpan?.style.backgroundClip).toBe('text');
  });

  it('applies dimmed white color for future syllables', () => {
    const verses = [
      verse(0, [
        { text: 'Now', startTime: 0, endTime: 1 },
        { text: 'Later', startTime: 5, endTime: 6 },
      ]),
    ];
    mockParseVersesWithSyllables.mockReturnValue(verses);
    const { container } = render(
      <KaraokeLyrics song={makeSong(['note'])} currentTime={0.1} />,
    );
    const spans = container.querySelectorAll('span');
    const laterSpan = Array.from(spans).find(s => s.textContent?.includes('Later'));
    // Future syllable should be dimmed white (uses CSS custom property with fallback)
    expect(laterSpan?.style.color).toContain('rgba(255,255,255,0.85)');
  });

  it('renders sweep clip for partially-sung syllable', () => {
    const verses = [
      verse(0, [
        { text: 'Sing', startTime: 0, endTime: 2, hasTrailingSpace: false },
      ]),
    ];
    mockParseVersesWithSyllables.mockReturnValue(verses);
    const { container } = render(
      <KaraokeLyrics song={makeSong(['note'])} currentTime={1} />,
    );
    // Should have clipPath sweep (absolute positioned span)
    const sweepSpan = container.querySelector('span[style*="position: absolute"]') ||
      container.querySelector('span[style*="clip"]');
    // At time 1, progress = (1-0)/(2-0) = 0.5 → clipPath inset(0 50% 0 0)
    expect(sweepSpan).toBeTruthy();
  });

  it('shows next verse in gray when available', () => {
    const verses = [
      verse(0, [{ text: 'Line1', startTime: 0, endTime: 2 }]),
      verse(3, [{ text: 'Line2', startTime: 3, endTime: 5 }]),
    ];
    mockParseVersesWithSyllables.mockReturnValue(verses);
    const { container } = render(
      <KaraokeLyrics song={makeSong(['note'])} currentTime={0.5} />,
    );
    expect(container.textContent).toContain('Line2');
    // Next verse should be in a secondary, dimmed paragraph (color #666 or #777)
    const grayP = container.querySelector('p[style*="color: rgb(102, 102, 102)"]') ||
      container.querySelector('p[style*="#666"]');
    expect(grayP).toBeTruthy();
  });

  it('applies gap offset to currentTime', () => {
    // gap=5000ms → adjustedTime = currentTime - 5000/1000 = currentTime - 5
    const verses = [
      verse(0, [{ text: 'Word', startTime: 0, endTime: 1 }]),
    ];
    mockParseVersesWithSyllables.mockReturnValue(verses);
    // With gap=5000, currentTime=4 → adjustedTime=-1 → no active verse (verses exist → 🎵)
    const { container } = render(
      <KaraokeLyrics song={makeSong(['note'], 120, 5000)} currentTime={4} />,
    );
    expect(container.textContent).toContain('🎵');
  });

  it('applies gap offset — active when time > gap', () => {
    const verses = [
      verse(0, [{ text: 'Word', startTime: 0, endTime: 1 }]),
    ];
    mockParseVersesWithSyllables.mockReturnValue(verses);
    // gap=2000 → adjustedTime = 3 - 2 = 1 → should be active
    const { container } = render(
      <KaraokeLyrics song={makeSong(['note'], 120, 2000)} currentTime={3} />,
    );
    expect(container.textContent).toContain('Word');
  });

  it('advances to later verses based on time', () => {
    const verses = [
      verse(0, [{ text: 'First', startTime: 0, endTime: 2 }]),
      verse(3, [{ text: 'Second', startTime: 3, endTime: 5 }]),
      verse(6, [{ text: 'Third', startTime: 6, endTime: 8 }]),
    ];
    mockParseVersesWithSyllables.mockReturnValue(verses);
    const { container } = render(
      <KaraokeLyrics song={makeSong(['note'])} currentTime={4} />,
    );
    // At time 4, second verse (ts=3) is active, third is next
    const text = container.textContent;
    expect(text).toContain('Second');
    expect(text).toContain('Third');
  });

  it('passes bpm to parseVersesWithSyllables', () => {
    mockParseVersesWithSyllables.mockReturnValue([]);
    render(<KaraokeLyrics song={makeSong(['note'], 150)} currentTime={0} />);
    expect(mockParseVersesWithSyllables).toHaveBeenCalledWith(['note'], 150);
  });

  it('handles null bpm by passing undefined', () => {
    mockParseVersesWithSyllables.mockReturnValue([]);
    render(<KaraokeLyrics song={makeSong(['note'], null)} currentTime={0} />);
    expect(mockParseVersesWithSyllables).toHaveBeenCalledWith(['note'], undefined);
  });
});
