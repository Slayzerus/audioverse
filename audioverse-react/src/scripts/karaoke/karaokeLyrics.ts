export interface KaraokeLine {
    text: string;
    timestamp: number;
}

/**
 * Represents a single word/syllable in the karaoke
 */
export interface KaraokeWord {
    text: string;
    startTime: number;
    endTime: number;
    isGolden: boolean;
}

/**
 * Represents a verse (line) with words
 */
export interface KaraokeVerse {
    text: string;
    timestamp: number;
    words: KaraokeWord[];
}

/**
 * Przelicza beat UltraStar na sekundy.
 * Formuła z UltraStar WorldParty: time = beat * 60 / (BPM * 4) = beat * 15 / BPM.
 * Fallback: beat / 10 (odpowiada BPM=150).
 */
const beatToSec = (beat: number, bpm: number | null): number => {
    if (bpm && bpm > 0) return beat * 15 / bpm;
    return beat / 10;
};

/** Extracts BPM from #BPM: headers in UltraStar note lines. */
const extractBpm = (notes: string[]): number | null => {
    for (const line of notes) {
        const t = line.trim();
        if (t.toUpperCase().startsWith('#BPM:')) {
            const v = parseFloat(t.substring(5).replace(',', '.'));
            if (isFinite(v) && v > 0) return v;
        }
    }
    return null;
};

/**
 * Parsuje nuty z Ultrastar na wersy i przypisuje im timestampy.
 * Zwraca linie z pełnym tekstem (dla kompatybilności)
 */
export const parseLyrics = (notes: string[], bpmOverride?: number): KaraokeLine[] => {
    const bpm = bpmOverride ?? extractBpm(notes);
    const lyrics: KaraokeLine[] = [];
    
    let currentLine = "";
    let currentTimestamp = 0;
    let currentWord = "";
    let previousSyllableEndedWithSpace = true; // First syllable always starts a new word

    function finalizeWord() {
        if (currentWord.trim() !== "") {
            if (currentLine.length > 0) currentLine += " ";
            currentLine += currentWord.trim();
        }
        currentWord = "";
    }

    notes.forEach((note) => {
        if (note.startsWith("#") || note.startsWith("E")) {
            return;
        }

        if (note.startsWith("-")) {
            finalizeWord();
            if (currentLine.trim().length > 0) {
                lyrics.push({ text: currentLine.trim(), timestamp: currentTimestamp });
                currentLine = "";
            }
            previousSyllableEndedWithSpace = true; // Reset for new line
        } else if (note.startsWith(":") || note.startsWith("*")) {
            const firstSpace = note.indexOf(" ");
            const secondSpace = note.indexOf(" ", firstSpace + 1);
            const thirdSpace = note.indexOf(" ", secondSpace + 1);
            const fourthSpace = note.indexOf(" ", thirdSpace + 1);
            
            if (fourthSpace === -1) return;
            
            const startTime = beatToSec(parseFloat(note.substring(firstSpace + 1, secondSpace)), bpm);
            if (currentLine === "") {
                currentTimestamp = startTime;
            }
            
            const rawText = note.substring(fourthSpace + 1); // +1 to skip the space after the number

            if (rawText.trim() === "~") {
                return;
            }

            let syllableText = rawText;
            if (syllableText.startsWith("~")) {
                syllableText = syllableText.substring(1);
            }

            // KEY CHANGE: Check if PREVIOUS syllable ended with a space
            if (previousSyllableEndedWithSpace) {
                finalizeWord();
                currentWord = syllableText.trimEnd();
            } else {
                currentWord += syllableText.trimEnd();
            }
            
            // Remember whether this syllable ends with a space
            previousSyllableEndedWithSpace = rawText.endsWith(" ");
        }
    });

    finalizeWord();
    if (currentLine.trim().length > 0) {
        lyrics.push({ text: currentLine.trim(), timestamp: currentTimestamp });
    }
    return lyrics;
};

export const parseVersesWithWords = (notes: string[], bpmOverride?: number): KaraokeVerse[] => {
    const bpm = bpmOverride ?? extractBpm(notes);
    const verses: KaraokeVerse[] = [];
    let currentLineWords: KaraokeWord[] = [];
    let currentLineText = "";
    let currentLineTimestamp = 0;
    let previousSyllableEndedWithSpace = true;

    let currentWord: KaraokeWord | null = null;
    let currentWordText = "";

    function finalizeWord() {
        if (currentWord && currentWordText.trim() !== "") {
            currentWord.text = currentWordText.trim();
            currentLineWords.push({ ...currentWord });
            if (currentLineText.length > 0) currentLineText += " ";
            currentLineText += currentWord.text;
        }
        currentWord = null;
        currentWordText = "";
    }

    notes.forEach((note) => {
        if (note.startsWith("#") || note.startsWith("E")) {
            return;
        }

        if (note.startsWith("-")) {
            finalizeWord();
            if (currentLineText.trim().length > 0) {
                verses.push({
                    text: currentLineText.trim(),
                    timestamp: currentLineTimestamp,
                    words: currentLineWords
                });
                currentLineText = "";
                currentLineWords = [];
            }
            previousSyllableEndedWithSpace = true;
        } else if (note.startsWith(":") || note.startsWith("*")) {
            const isGolden = note.startsWith("*");
            
            const firstSpace = note.indexOf(" ");
            const secondSpace = note.indexOf(" ", firstSpace + 1);
            const thirdSpace = note.indexOf(" ", secondSpace + 1);
            const fourthSpace = note.indexOf(" ", thirdSpace + 1);
            
            if (fourthSpace === -1) return;
            
            const startTime = beatToSec(parseFloat(note.substring(firstSpace + 1, secondSpace)), bpm);
            const duration = beatToSec(parseFloat(note.substring(secondSpace + 1, thirdSpace)), bpm);
            const endTime = startTime + duration;
            
            if (currentLineText === "") {
                currentLineTimestamp = startTime;
            }
            
            const rawText = note.substring(fourthSpace + 1);

            if (rawText.trim() === "~") {
                if (currentWord) {
                    currentWord.endTime = endTime;
                }
                return;
            }

            let syllableText = rawText;
            if (syllableText.startsWith("~")) {
                syllableText = syllableText.substring(1);
            }

            // KEY CHANGE: Check if PREVIOUS syllable ended with a space
            if (previousSyllableEndedWithSpace) {
                finalizeWord();
                currentWordText = syllableText.trimEnd();
                currentWord = {
                    text: "",
                    startTime,
                    endTime,
                    isGolden
                };
            } else {
                if (!currentWord) {
                    currentWordText = syllableText.trimEnd();
                    currentWord = {
                        text: "",
                        startTime,
                        endTime,
                        isGolden
                    };
                } else {
                    currentWordText += syllableText.trimEnd();
                    currentWord.endTime = endTime;
                    if (isGolden) currentWord.isGolden = true;
                }
            }
            
            previousSyllableEndedWithSpace = rawText.endsWith(" ");
        }
    });

    finalizeWord();
    if (currentLineText.trim().length > 0) {
        verses.push({
            text: currentLineText.trim(),
            timestamp: currentLineTimestamp,
            words: currentLineWords
        });
    }
    return verses;
};

/**
 * Represents a single syllable in the karaoke with precise timing
 */
export interface KaraokeSyllable {
    text: string;       // raw text of syllable
    startTime: number;  // beat-based start in seconds
    endTime: number;    // beat-based end in seconds
    isGolden: boolean;
    hasTrailingSpace: boolean; // whether a space follows this syllable (word boundary)
}

/**
 * Represents a verse (line) with syllables
 */
export interface KaraokeSyllableVerse {
    timestamp: number;
    syllables: KaraokeSyllable[];
}

/**
 * Parsuje nuty UltraStar na wersy z sylabami — każda nuta = osobna sylaba z własnym timingiem.
 */
export const parseVersesWithSyllables = (notes: string[], bpmOverride?: number): KaraokeSyllableVerse[] => {
    const bpm = bpmOverride ?? extractBpm(notes);
    const verses: KaraokeSyllableVerse[] = [];
    let currentSyllables: KaraokeSyllable[] = [];
    let currentLineTimestamp = 0;

    function finalizeLine() {
        if (currentSyllables.length > 0) {
            verses.push({ timestamp: currentLineTimestamp, syllables: [...currentSyllables] });
            currentSyllables = [];
        }
    }

    notes.forEach((note) => {
        if (note.startsWith("#") || note.startsWith("E")) return;

        if (note.startsWith("-")) {
            finalizeLine();
            // Line break can also carry a beat timestamp for the next line
            const parts = note.trim().split(/\s+/);
            if (parts.length >= 2) {
                const nextBeat = parseFloat(parts[1]);
                if (isFinite(nextBeat)) currentLineTimestamp = beatToSec(nextBeat, bpm);
            }
        } else if (note.startsWith(":") || note.startsWith("*")) {
            const isGolden = note.startsWith("*");
            const firstSpace = note.indexOf(" ");
            const secondSpace = note.indexOf(" ", firstSpace + 1);
            const thirdSpace = note.indexOf(" ", secondSpace + 1);
            const fourthSpace = note.indexOf(" ", thirdSpace + 1);
            if (fourthSpace === -1) return;

            const startBeat = parseFloat(note.substring(firstSpace + 1, secondSpace));
            const durationBeat = parseFloat(note.substring(secondSpace + 1, thirdSpace));
            const startTime = beatToSec(startBeat, bpm);
            const endTime = startTime + beatToSec(durationBeat, bpm);

            if (currentSyllables.length === 0) {
                currentLineTimestamp = startTime;
            }

            const rawText = note.substring(fourthSpace + 1);
            if (rawText.trim() === "~") {
                // melisma — extend previous syllable
                if (currentSyllables.length > 0) {
                    currentSyllables[currentSyllables.length - 1].endTime = endTime;
                }
                return;
            }

            let syllableText = rawText;
            if (syllableText.startsWith("~")) syllableText = syllableText.substring(1);

            const hasTrailingSpace = rawText.endsWith(" ");
            // Trim only trailing space for display — keep leading chars
            const displayText = hasTrailingSpace ? syllableText.slice(0, -1) : syllableText;

            currentSyllables.push({
                text: displayText,
                startTime,
                endTime,
                isGolden,
                hasTrailingSpace
            });
        }
    });

    finalizeLine();
    return verses;
};

export const getActiveLyrics = (lyrics: KaraokeLine[], currentTime: number, maxLines = 3): string[] => {
    const activeLines: string[] = [];

    // Find the index of the currently active line
    let currentLineIndex = -1;
    for (let i = 0; i < lyrics.length; i++) {
        const lineStart = lyrics[i].timestamp;
        const lineEnd = lyrics[i + 1] ? lyrics[i + 1].timestamp : lineStart + 5;

        if (currentTime >= lineStart && currentTime < lineEnd) {
            currentLineIndex = i;
            break;
        }
    }

    // Display history (previous lines) + current line
    if (currentLineIndex >= 0) {
        // Add previous lines (up to maxLines-1 lines back)
        const startIndex = Math.max(0, currentLineIndex - (maxLines - 1));
        for (let i = startIndex; i <= currentLineIndex; i++) {
            activeLines.push(lyrics[i].text);
        }
    }
    return activeLines;
};

/**
 * Znajduje aktywne słowa do wyświetlenia na podstawie aktualnego czasu.
 */
export const getActiveWords = (verses: KaraokeVerse[], currentTime: number): KaraokeWord[] => {
    const activeWords: KaraokeWord[] = [];

    for (const verse of verses) {
        for (const word of verse.words) {
            if (currentTime >= word.startTime && currentTime <= word.endTime) {
                activeWords.push(word);
            }
        }
    }
    return activeWords;
};

