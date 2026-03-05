import { useRef, useState, useEffect } from 'react';
import type { MutableRefObject } from 'react';
import type { AudioRecorder } from '../../../scripts/recording';
import { postTranscribe } from '../../../scripts/api/apiLibraryAiAudio';
import { logger } from '../../../utils/logger';
import type { KaraokeSongFile } from '../../../models/modelsKaraoke';
import type { TranscriptionMatch } from './useKaraokeManager';

const log = logger.scoped('KaraokeTranscription');

// ── Props ──
export interface UseKaraokeTranscriptionProps {
    isPlaying: boolean;
    uploadedSong: KaraokeSongFile | null;
    gameMode: string;
    recordersRef: MutableRefObject<{ [playerId: number]: AudioRecorder }>;
    currentTimeRef: MutableRefObject<number>;
}

export function useKaraokeTranscription({
    isPlaying,
    uploadedSong,
    gameMode,
    recordersRef,
    currentTimeRef,
}: UseKaraokeTranscriptionProps) {
    // ── State ──
    const [transcriptionMatches, setTranscriptionMatches] = useState<TranscriptionMatch[]>([]);
    const lastTranscribeTimeRef = useRef<number>(0);

    // ═══════════════════════════════════════════════════════════════
    //  Live transcription comparison (POST /api/ai/audio/transcribe)
    //  Every ~10s grab a recording chunk, transcribe, compare to lyrics
    // ═══════════════════════════════════════════════════════════════
    useEffect(() => {
        if (!isPlaying || !uploadedSong || gameMode === 'pad') {
            setTranscriptionMatches([]);
            lastTranscribeTimeRef.current = 0;
            return;
        }

        const INTERVAL_MS = 10_000; // transcribe every 10 seconds

        /** Extract expected lyrics text for a time window from UltraStar notes. */
        const getExpectedLyrics = (startSec: number, endSec: number): string => {
            if (!uploadedSong) return '';
            const bpm = uploadedSong.bpm || 300;
            const gap = (uploadedSong.gap || 0) / 1000; // gap in seconds
            const beatDur = 60 / (bpm * 4); // duration of one beat in seconds

            const words: string[] = [];
            for (const note of uploadedSong.notes) {
                const line = note.noteLine?.trim();
                if (!line || line === 'E') continue;
                // UltraStar format: : <start> <dur> <pitch> <text>  or  * <start> <dur> <pitch> <text>
                const m = line.match(/^[:*F]\s+(\d+)\s+(\d+)\s+[-\d]+\s+(.*)$/);
                if (!m) continue;
                const noteStart = gap + parseInt(m[1]) * beatDur;
                const noteEnd = noteStart + parseInt(m[2]) * beatDur;
                if (noteEnd >= startSec && noteStart <= endSec) {
                    const text = m[3].trim();
                    if (text) words.push(text);
                }
            }
            return words.join('').replace(/~/g, ' ').trim();
        };

        /** Simple word-level overlap ratio. */
        const computeMatchRatio = (transcribed: string, expected: string): number => {
            if (!expected || !transcribed) return 0;
            const norm = (s: string) => s.toLowerCase().replace(/[^a-ząćęłńóśźżäöüß\w]/g, ' ').split(/\s+/).filter(Boolean);
            const tWords = norm(transcribed);
            const eWords = norm(expected);
            if (eWords.length === 0) return 0;
            let matched = 0;
            const used = new Set<number>();
            for (const tw of tWords) {
                for (let i = 0; i < eWords.length; i++) {
                    if (!used.has(i) && eWords[i] === tw) {
                        matched++;
                        used.add(i);
                        break;
                    }
                }
            }
            return matched / eWords.length;
        };

        const timer = setInterval(async () => {
            const now = currentTimeRef.current;
            const windowStart = lastTranscribeTimeRef.current;
            const windowEnd = now;
            if (windowEnd - windowStart < 3) return; // at least 3 seconds of content

            // Find the first player's recorder to extract audio
            const playerIds = Object.keys(recordersRef.current).map(Number);
            if (playerIds.length === 0) return;
            const pid = playerIds[0];
            const recorder = recordersRef.current[pid];
            if (!recorder) return;
            const stream = recorder.getStream();
            if (!stream) return;

            try {
                // record a short snippet using a temporary MediaRecorder
                const tempRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
                const chunks: BlobPart[] = [];
                tempRecorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
                const blob = await new Promise<Blob>((resolve) => {
                    tempRecorder.onstop = () => resolve(new Blob(chunks, { type: 'audio/webm' }));
                    tempRecorder.start();
                    setTimeout(() => { try { tempRecorder.stop(); } catch (_e) { resolve(new Blob()); } }, 2000);
                });

                if (blob.size < 100) return; // too small, skip

                const file = new File([blob], 'segment.webm', { type: 'audio/webm' });
                const resp = await postTranscribe(file, { language: (uploadedSong as unknown as Record<string, unknown>).language as string || null });
                const transcribedText = resp?.text?.trim() || '';
                const expectedText = getExpectedLyrics(windowStart, windowEnd);
                const matchRatio = computeMatchRatio(transcribedText, expectedText);

                lastTranscribeTimeRef.current = now;

                const match: TranscriptionMatch = {
                    transcribedText,
                    expectedText,
                    matchRatio,
                    windowStart,
                    windowEnd,
                };
                setTranscriptionMatches(prev => [...prev.slice(-9), match]); // keep last 10
                log.debug('[KaraokeManager] transcription match:', match);
            } catch (err) {
                log.warn('[KaraokeManager] transcription failed:', err);
            }
        }, INTERVAL_MS);

        return () => clearInterval(timer);
    }, [isPlaying, uploadedSong, gameMode]);

    return {
        transcriptionMatches,
    };
}
