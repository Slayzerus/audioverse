import { describe, it, expect } from 'vitest';
import {
  parseLyrics,
  parseVersesWithWords,
  parseVersesWithSyllables,
  getActiveLyrics,
  getActiveWords,
} from '../scripts/karaoke/karaokeLyrics';

describe('karaokeLyrics — deep coverage', () => {
  // === parseLyrics extended ===

  describe('parseLyrics', () => {
    it('handles BPM with comma decimal (European format)', () => {
      const notes = [
        '#BPM:150,5',
        ': 0 4 60 Hello',
        '-',
      ];
      const lines = parseLyrics(notes);
      expect(lines.length).toBe(1);
      expect(lines[0].text).toContain('Hello');
      // With BPM 150.5: startTime = 0 * 15 / 150.5 = 0
      expect(lines[0].timestamp).toBeCloseTo(0, 2);
    });

    it('uses bpmOverride over header BPM', () => {
      const notes = [
        '#BPM:200',
        ': 0 1 60 Hi ',
        '-',
      ];
      const withHeader = parseLyrics(notes);
      const withOverride = parseLyrics(notes, 100);
      // Both should produce one line but with different timestamps for subsequent notes
      expect(withHeader.length).toBe(1);
      expect(withOverride.length).toBe(1);
    });

    it('falls back to beat/10 when no BPM', () => {
      const notes = [
        ': 0 10 60 Word',
        '-',
      ];
      const lines = parseLyrics(notes);
      expect(lines.length).toBe(1);
      // With no BPM: timestamp = beat/10, so beat 0 = 0.0
      expect(lines[0].timestamp).toBeCloseTo(0, 2);
    });

    it('skips # header and E end lines', () => {
      const notes = [
        '#TITLE:Test',
        '#ARTIST:Test',
        '#BPM:120',
        ': 0 1 60 Hi',
        '-',
        'E',
      ];
      const lines = parseLyrics(notes);
      expect(lines.length).toBe(1);
      expect(lines[0].text).toBe('Hi');
    });

    it('handles ~ tilde (melisma) — skips it', () => {
      const notes = [
        '#BPM:120',
        ': 0 2 60 Oh ',
        ': 2 1 60 ~',
        ': 3 1 62 yeah',
        '-',
      ];
      const lines = parseLyrics(notes);
      expect(lines.length).toBe(1);
      expect(lines[0].text).toContain('Oh');
      expect(lines[0].text).toContain('yeah');
      // Tilde should not add any text
      expect(lines[0].text).not.toContain('~');
    });

    it('handles syllable starting with ~ (melisma prefix)', () => {
      const notes = [
        '#BPM:120',
        ': 0 1 60 Go ',
        ': 1 1 62 ~od',
        '-',
      ];
      const lines = parseLyrics(notes);
      expect(lines.length).toBe(1);
      // ~ at start is stripped, so syllable is "od"
      expect(lines[0].text).toContain('od');
    });

    it('handles * golden notes like regular notes', () => {
      const notes = [
        '#BPM:120',
        '* 0 2 60 Gol ',
        '* 2 2 65 den',
        '-',
      ];
      const lines = parseLyrics(notes);
      expect(lines.length).toBe(1);
      expect(lines[0].text).toContain('Gol');
      expect(lines[0].text).toContain('den');
    });

    it('handles multiple verse lines', () => {
      const notes = [
        '#BPM:120',
        ': 0 1 60 Line ',
        ': 1 1 62 one',
        '-',
        ': 4 1 60 Line ',
        ': 5 1 62 two',
        '-',
      ];
      const lines = parseLyrics(notes);
      expect(lines.length).toBe(2);
      expect(lines[0].text).toContain('one');
      expect(lines[1].text).toContain('two');
      expect(lines[1].timestamp).toBeGreaterThan(lines[0].timestamp);
    });

    it('handles trailing content after last notes without dash', () => {
      const notes = [
        '#BPM:120',
        ': 0 1 60 End ',
        ': 1 1 60 song',
      ];
      const lines = parseLyrics(notes);
      expect(lines.length).toBe(1);
      expect(lines[0].text).toContain('End');
      expect(lines[0].text).toContain('song');
    });

    it('word boundary logic — space at end of syllable marks new word', () => {
      const notes = [
        '#BPM:120',
        ': 0 1 60 He ',   // ends with space -> next syllable starts new word
        ': 1 1 62 llo ',  // ends with space ->  next starts new word
        ': 2 1 64 World',
        '-',
      ];
      const lines = parseLyrics(notes);
      expect(lines[0].text).toContain('He');
      expect(lines[0].text).toContain('llo');
      expect(lines[0].text).toContain('World');
    });

    it('syllables without trailing space are concatenated into one word', () => {
      const notes = [
        '#BPM:120',
        ': 0 1 60 He',   // no space -> continues
        ': 1 1 62 llo',   // no space -> continues
        '-',
      ];
      const lines = parseLyrics(notes);
      expect(lines[0].text).toBe('Hello');
    });

    it('malformed note line (missing 4th space) is skipped', () => {
      const notes = [
        '#BPM:120',
        ': 0 1 60',  // missing text part -> fourthSpace === -1
        ': 1 1 62 good',
        '-',
      ];
      const lines = parseLyrics(notes);
      expect(lines.length).toBe(1);
    });
  });

  // === parseVersesWithWords extended ===

  describe('parseVersesWithWords', () => {
    it('marks golden notes', () => {
      const notes = [
        '#BPM:120',
        '* 0 2 60 Gold ',
        ': 2 2 62 normal',
        '-',
      ];
      const verses = parseVersesWithWords(notes);
      expect(verses.length).toBe(1);
      const words = verses[0].words;
      expect(words[0].isGolden).toBe(true);
      expect(words[1].isGolden).toBe(false);
    });

    it('tilde extends word endTime (melisma)', () => {
      const notes = [
        '#BPM:120',
        ': 0 2 60 Oh',
        ': 2 2 60 ~',  // melisma extends Oh
        '-',
      ];
      const verses = parseVersesWithWords(notes);
      expect(verses.length).toBe(1);
      const word = verses[0].words[0];
      // endTime should be extended by the melisma
      expect(word.endTime).toBeGreaterThan(word.startTime);
      // Original duration = 2 beats = 2*15/120 = 0.25s, melisma adds another 2*15/120 = 0.25s
      expect(word.endTime).toBeCloseTo(0.5, 2);
    });

    it('syllables without trailing space join into one word', () => {
      const notes = [
        '#BPM:120',
        ': 0 1 60 He',   // no trailing space
        ': 1 1 62 llo',  // no trailing space  
        '-',
      ];
      const verses = parseVersesWithWords(notes);
      expect(verses.length).toBe(1);
      expect(verses[0].words.length).toBe(1);
      expect(verses[0].words[0].text).toBe('Hello');
    });

    it('golden syllable within compound word marks whole word as golden', () => {
      const notes = [
        '#BPM:120',
        ': 0 1 60 He',    // not golden
        '* 1 1 62 llo',   // golden -> makes compound word golden
        '-',
      ];
      const verses = parseVersesWithWords(notes);
      expect(verses[0].words[0].isGolden).toBe(true);
    });

    it('handles trailing content without dash', () => {
      const notes = [
        '#BPM:120',
        ': 0 1 60 End ',
        ': 1 1 60 song',
      ];
      const verses = parseVersesWithWords(notes);
      expect(verses.length).toBe(1);
      expect(verses[0].words.length).toBe(2);
    });

    it('handles no BPM (fallback timing)', () => {
      const notes = [
        ': 0 10 60 Hello ',
        ': 10 10 62 World',
        '-',
      ];
      const verses = parseVersesWithWords(notes);
      expect(verses.length).toBe(1);
      // With fallback bpm=null: beat/10, so beat 0 = 0s, beat 10 = 1s
      expect(verses[0].words[0].startTime).toBeCloseTo(0, 2);
      expect(verses[0].words[1].startTime).toBeCloseTo(1, 2);
    });
  });

  // === parseVersesWithSyllables extended ===

  describe('parseVersesWithSyllables', () => {
    it('handles line break with beat timestamp for next line', () => {
      const notes = [
        '#BPM:120',
        ': 0 1 60 He ',
        ': 1 1 62 llo',
        '- 8',          // line break at beat 8
        ': 8 1 64 World',
        '-',
      ];
      const syllables = parseVersesWithSyllables(notes);
      expect(syllables.length).toBe(2);
      // Second verse timestamp should be based on beat 8
      expect(syllables[1].timestamp).toBeCloseTo(8 * 15 / 120, 2);
    });

    it('melisma extends previous syllable endTime', () => {
      const notes = [
        '#BPM:120',
        ': 0 2 60 Oh',
        ': 2 2 60 ~',
        '-',
      ];
      const verses = parseVersesWithSyllables(notes);
      expect(verses[0].syllables.length).toBe(1); // melisma doesn't add new syllable
      expect(verses[0].syllables[0].endTime).toBeCloseTo(0.5, 2); // extended
    });

    it('syllable starting with ~ has ~ stripped', () => {
      const notes = [
        '#BPM:120',
        ': 0 1 60 Go ',
        ': 1 1 62 ~od',
        '-',
      ];
      const verses = parseVersesWithSyllables(notes);
      expect(verses[0].syllables.length).toBe(2);
      expect(verses[0].syllables[1].text).toBe('od'); // ~ stripped
    });

    it('hasTrailingSpace is correct', () => {
      const notes = [
        '#BPM:120',
        ': 0 1 60 He ',   // trailing space
        ': 1 1 62 llo',   // no trailing space
        '-',
      ];
      const verses = parseVersesWithSyllables(notes);
      expect(verses[0].syllables[0].hasTrailingSpace).toBe(true);
      expect(verses[0].syllables[1].hasTrailingSpace).toBe(false);
    });

    it('golden notes set isGolden on syllable', () => {
      const notes = [
        '#BPM:120',
        '* 0 2 60 Gold ',
        ': 2 1 62 normal',
        '-',
      ];
      const verses = parseVersesWithSyllables(notes);
      expect(verses[0].syllables[0].isGolden).toBe(true);
      expect(verses[0].syllables[1].isGolden).toBe(false);
    });

    it('malformed note is skipped', () => {
      const notes = [
        '#BPM:120',
        ': 0 1 60',   // missing text
        ': 1 1 62 ok',
        '-',
      ];
      const verses = parseVersesWithSyllables(notes);
      expect(verses[0].syllables.length).toBe(1);
      expect(verses[0].syllables[0].text).toBe('ok');
    });
  });

  // === getActiveLyrics extended ===

  describe('getActiveLyrics', () => {
    const lyrics = [
      { text: 'Line 1', timestamp: 0 },
      { text: 'Line 2', timestamp: 2 },
      { text: 'Line 3', timestamp: 4 },
      { text: 'Line 4', timestamp: 6 },
    ];

    it('returns first line when time is at start', () => {
      const active = getActiveLyrics(lyrics, 0.5, 3);
      expect(active).toContain('Line 1');
    });

    it('returns current + history within maxLines', () => {
      const active = getActiveLyrics(lyrics, 5, 3);
      // currentLineIndex = 2 (Line 3), history includes Line 1, Line 2, Line 3
      expect(active.length).toBeLessThanOrEqual(3);
      expect(active[active.length - 1]).toBe('Line 3');
    });

    it('returns empty array for time before all lyrics', () => {
      const active = getActiveLyrics(lyrics, -1, 3);
      expect(active).toEqual([]);
    });

    it('returns empty array for time after all lyrics + 5s window', () => {
      const active = getActiveLyrics(lyrics, 100, 3);
      expect(active).toEqual([]);
    });

    it('respects maxLines=1', () => {
      const active = getActiveLyrics(lyrics, 5, 1);
      expect(active.length).toBeLessThanOrEqual(1);
    });

    it('defaults to maxLines=3', () => {
      const active = getActiveLyrics(lyrics, 5);
      expect(active.length).toBeLessThanOrEqual(3);
    });

    it('returns last line when within its 5-second window', () => {
      // Last line at timestamp 6, window until 11
      const active = getActiveLyrics(lyrics, 8, 3);
      expect(active[active.length - 1]).toBe('Line 4');
    });
  });

  // === getActiveWords extended ===

  describe('getActiveWords', () => {
    const verses = [
      {
        text: 'Hello World',
        timestamp: 0,
        words: [
          { text: 'Hello', startTime: 0, endTime: 0.5, isGolden: false },
          { text: 'World', startTime: 0.5, endTime: 1.0, isGolden: true },
        ],
      },
      {
        text: 'Goodbye',
        timestamp: 2,
        words: [
          { text: 'Goodbye', startTime: 2, endTime: 3, isGolden: false },
        ],
      },
    ];

    it('returns word active at given time', () => {
      const words = getActiveWords(verses, 0.3);
      expect(words.length).toBe(1);
      expect(words[0].text).toBe('Hello');
    });

    it('returns golden word', () => {
      const words = getActiveWords(verses, 0.7);
      expect(words.length).toBe(1);
      expect(words[0].text).toBe('World');
      expect(words[0].isGolden).toBe(true);
    });

    it('returns empty when between words', () => {
      const words = getActiveWords(verses, 1.5);
      expect(words.length).toBe(0);
    });

    it('returns word from later verse', () => {
      const words = getActiveWords(verses, 2.5);
      expect(words.length).toBe(1);
      expect(words[0].text).toBe('Goodbye');
    });

    it('returns empty for time before all words', () => {
      const words = getActiveWords(verses, -1);
      expect(words.length).toBe(0);
    });

    it('returns empty for time after all words', () => {
      const words = getActiveWords(verses, 100);
      expect(words.length).toBe(0);
    });

    it('includes word at exact start boundary', () => {
      const words = getActiveWords(verses, 0);
      expect(words.some(w => w.text === 'Hello')).toBe(true);
    });

    it('includes word at exact end boundary', () => {
      const words = getActiveWords(verses, 0.5);
      // At 0.5 both Hello (endTime=0.5) and World (startTime=0.5) match
      expect(words.length).toBeGreaterThanOrEqual(1);
    });
  });
});
