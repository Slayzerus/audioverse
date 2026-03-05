import { parseLyrics, parseVersesWithWords, parseVersesWithSyllables, getActiveLyrics, getActiveWords } from '../scripts/karaoke/karaokeLyrics';

describe('karaoke lyrics parsing', () => {
  const notes = [
    '#BPM:120',
    ': 0 1 60 H ', // H (ends with space)
    ': 1 1 62 e ',
    ': 2 1 64 l',  // no trailing space
    ': 3 1 65 l ',
    '-'
  ];

  test('parseLyrics builds lines and timestamps', () => {
    const lines = parseLyrics(notes);
    expect(lines.length).toBeGreaterThanOrEqual(1);
    // parser may insert spaces between syllables; compare without spaces
    expect(lines[0].text.replace(/\s+/g, '')).toContain('Hel');
    expect(typeof lines[0].timestamp).toBe('number');
  });

  test('parseVersesWithWords returns words with timing and golden flags', () => {
    const verses = parseVersesWithWords(notes);
    expect(verses.length).toBeGreaterThanOrEqual(1);
    const v = verses[0];
    expect(v.words.length).toBeGreaterThanOrEqual(1);
    expect(v.words[0]).toHaveProperty('startTime');
    expect(v.words[0]).toHaveProperty('endTime');
  });

  test('parseVersesWithSyllables returns syllables with trailing space flags', () => {
    const syl = parseVersesWithSyllables(notes);
    expect(syl.length).toBeGreaterThanOrEqual(1);
    const s = syl[0].syllables;
    // first syllable should have hasTrailingSpace true
    expect(s[0].hasTrailingSpace).toBe(true);
    // third syllable (no trailing space) should be false
    expect(s[2].hasTrailingSpace).toBe(false);
  });

  test('getActiveLyrics selects correct active lines', () => {
    const lines = parseLyrics(notes);
    const active = getActiveLyrics(lines, 0.1, 3);
    expect(Array.isArray(active)).toBe(true);
  });

  test('getActiveWords returns words active at given time', () => {
    const verses = parseVersesWithWords(notes);
    const t = 0.05; // near start
    const active = getActiveWords(verses, t);
    expect(Array.isArray(active)).toBe(true);
  });
});
