import type { KaraokeNoteData } from './karaokeTimelineTypes';

/**
 * Wyszukuje wartość BPM z nagłówków #BPM: w liniach nut UltraStar.
 * UltraStar WorldParty wewnętrznie mnoży BPM×4, więc formuła na czas to:
 *   time_seconds = beat * 60 / (fileBPM * 4) = beat * 15 / fileBPM
 */
export const extractBpmFromNotes = (notes: string[]): number | null => {
    for (const line of notes) {
        const trimmed = line.trim();
        if (trimmed.toUpperCase().startsWith('#BPM:')) {
            const val = parseFloat(trimmed.substring(5).replace(',', '.'));
            if (isFinite(val) && val > 0) return val;
        }
    }
    return null;
};

/**
 * Przelicza beat UltraStar na sekundy wg formuły z UltraStar WorldParty:
 *   time = beat * 60 / (BPM * 4) = beat * 15 / BPM
 * Fallback (brak BPM): beat / 10 (odpowiada BPM=150).
 */
const beatToSeconds = (beat: number, bpm: number | null): number => {
    if (bpm && bpm > 0) return beat * 15 / bpm;
    return beat / 10; // legacy fallback
};

/**
 * Konwertuje linijki nut Ultrastar na obiekty `KaraokeNoteData`.
 * Automatycznie wyciąga BPM z nagłówków #BPM: (jeśli obecne) do konwersji beat→s.
 */
export const parseNotes = (notes: string[], bpmOverride?: number): KaraokeNoteData[][] => {
    const bpm = bpmOverride ?? extractBpmFromNotes(notes);

    const noteLines: KaraokeNoteData[][] = [];
    let currentLine: KaraokeNoteData[] = [];

    notes.forEach(note => {
        const parts = note.split(" ");
        if (parts.length < 4) return;

        if (note.startsWith("-")) {
            if (currentLine.length > 0) {
                noteLines.push(currentLine);
                currentLine = [];
            }
        } else {
            const typeChar = (parts[0] || '').charAt(0);
            const isGold = typeChar === '*' || typeChar === 'G';
            currentLine.push({
                startTime: beatToSeconds(parseFloat(parts[1]), bpm),
                duration: beatToSeconds(parseFloat(parts[2]), bpm),
                pitch: parseInt(parts[3], 10),
                isGold,
            });
        }
    });

    if (currentLine.length > 0) noteLines.push(currentLine);
    return noteLines;
};

/**
 * Konwertuje Hz na UltraStar pitch z octave‑foldingiem wg UltraStar WorldParty:
 *   1. Hz → MIDI → pitch class (0-11)
 *   2. Dopasuj oktawę tak, by detected pitch był w zakresie ±6 od nuty docelowej
 * Jeśli brak nuty docelowej, zwraca surową wartość MIDI mod 12.
 */
export const hzToUltrastarPitch = (hz: number, targetNotePitch: number | null): number => {
    const midi = Math.round(12 * Math.log2(hz / 440) + 69);
    // Start with pitch class 0..11 (like UltraStar WorldParty's Tone from URecord.pas)
    let detected = ((midi % 12) + 12) % 12; // always 0..11

    if (targetNotePitch !== null) {
        // Octave folding from UNote.pas:
        //   while (CurrentSound.Tone - CurrentLineFragment.Tone > 6)  -= 12
        //   while (CurrentSound.Tone - CurrentLineFragment.Tone < -6) += 12
        while (detected - targetNotePitch > 6) detected -= 12;
        while (detected - targetNotePitch < -6) detected += 12;
    }
    return detected;
};
