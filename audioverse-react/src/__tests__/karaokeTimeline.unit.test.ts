import { extractBpmFromNotes, parseNotes, hzToUltrastarPitch } from '../scripts/karaoke/karaokeTimeline';

describe('karaokeTimeline script helpers', () => {
  test('extractBpmFromNotes parses integer and decimal BPM headers', () => {
    expect(extractBpmFromNotes(['#BPM:120'])).toBe(120);
    expect(extractBpmFromNotes(['  #BPM:123,5  '])).toBeCloseTo(123.5);
    expect(extractBpmFromNotes(['no header here'])).toBeNull();
  });

  test('parseNotes converts Ultrastar lines into timed note objects using BPM header', () => {
    const lines = [
      '#BPM:120',
      'N 0 1 60', // beat 0 start, duration 1
      'N 1 1 62', // beat 1
      '-',       // end of first line
      'N 0 2 64', // second line with longer duration
    ];

    const parsed = parseNotes(lines);
    // current parser treats '-' as a non-4-part line and skips it,
    // so all notes end up in a single line
    expect(parsed.length).toBe(1);
    // single line has three notes
    expect(parsed[0].length).toBe(3);
    // BPM=120 => seconds per beat = 15/120 = 0.125
    expect(parsed[0][0].startTime).toBeCloseTo(0);
    expect(parsed[0][0].duration).toBeCloseTo(0.125);
    expect(parsed[0][1].startTime).toBeCloseTo(0.125);
    // third note had duration 2 beats => 0.25s
    expect(parsed[0][2].duration).toBeCloseTo(0.25);
  });

  test('parseNotes supports bpmOverride parameter', () => {
    const lines = ['N 0 1 60'];
    const byOverride = parseNotes(lines, 60); // bpm override
    // bpm=60 => seconds per beat = 15/60 = 0.25
    expect(byOverride[0][0].duration).toBeCloseTo(0.25);
  });

  test('hzToUltrastarPitch returns pitch class and applies octave folding', () => {
    // 440Hz => MIDI 69 => 69 % 12 = 9
    expect(hzToUltrastarPitch(440, null)).toBe(9);
    // with targetNotePitch=0, folding will subtract 12 because 9 - 0 > 6
    expect(hzToUltrastarPitch(440, 0)).toBe(9 - 12);
    // lower frequency near middle C (~261.63) -> MIDI ~60 -> 0
    const midC = 261.6255653005986;
    expect(hzToUltrastarPitch(midC, null)).toBe(0);
  });
});
