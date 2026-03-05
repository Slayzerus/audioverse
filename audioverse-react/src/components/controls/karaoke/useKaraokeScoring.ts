import { useState, useEffect } from 'react';
import { scoreNotesWithPitchPoints, scaleResult } from '../../../utils/karaokeScoring';
import type { NoteStats } from '../../../utils/karaokeScoring';
import { getScoringPreset } from '../../../constants/karaokeScoringConfig';
import type { DifficultyLevel } from '../../../constants/karaokeScoringConfig';
import { parseNotes } from '../../../scripts/karaoke/karaokeTimeline';
import { buildNoteDescriptors, buildSegmentScores } from '../../../utils/karaokeHelpers';
import { loadKaraokeSettings } from '../../../scripts/karaoke/glossyBarRenderer';
import { PLAYER_COLORS } from '../../../constants/playerColors';
import { scoreBus } from '../../animations/karaokeIntegration';
import type { KaraokeSongFile } from '../../../models/modelsKaraoke';
import type { PitchPoint, SegmentScore, ComboState, VerseRating } from './useKaraokeManager';
import type { PlayerScoreEntry } from './KaraokeSummaryOverlay';

// ── Props ──
export interface UseKaraokeScoringProps {
    livePitch: { [playerId: number]: PitchPoint[] };
    uploadedSong: KaraokeSongFile | null;
    isPlaying: boolean;
    difficulty: DifficultyLevel;
    players: Array<{ id: number; name: string; micId?: string | null; color?: string }>;
    isPadMode: boolean;
}

export function useKaraokeScoring({
    livePitch,
    uploadedSong,
    isPlaying,
    difficulty,
    players,
    isPadMode,
}: UseKaraokeScoringProps) {
    // ── Live scoring state ──
    const [liveScore, setLiveScore] = useState(0);
    const [liveBonusScore, setLiveBonusScore] = useState(0);
    const [liveTotalScore, setLiveTotalScore] = useState(0);
    const [liveSegmentScores, setLiveSegmentScores] = useState<SegmentScore[]>([]);
    const [liveCombo, setLiveCombo] = useState<ComboState>({ maxCombo: 0, currentCombo: 0, totalComboBonus: 0 });
    const [liveVerseRatings, setLiveVerseRatings] = useState<VerseRating[]>([]);

    // ── Per-player scores (for multi-player summary) ──
    const [perPlayerScores, setPerPlayerScores] = useState<PlayerScoreEntry[]>([]);
    const [perPlayerSegmentScores, setPerPlayerSegmentScores] = useState<{ [playerId: number]: SegmentScore[] }>({});
    const [perPlayerCombo, setPerPlayerCombo] = useState<{ [playerId: number]: ComboState }>({});
    const [perPlayerVerseRatings, setPerPlayerVerseRatings] = useState<{ [playerId: number]: VerseRating[] }>({});
    const [perPlayerTotalScores, setPerPlayerTotalScores] = useState<{ [playerId: number]: number }>({});
    const [perPlayerNoteStats, setPerPlayerNoteStats] = useState<{ [playerId: number]: NoteStats }>({});

    // ═══════════════════════════════════════════════════════════════
    //  Live scoring: compute score + segmentScores from livePitch
    // ═══════════════════════════════════════════════════════════════
    useEffect(() => {
        if (!uploadedSong || !isPlaying) return;

        const noteLines = parseNotes(
            uploadedSong.notes.map(n => n.noteLine),
            uploadedSong.bpm ?? undefined
        );
        const gapSec = (uploadedSong.gap ?? 0) / 1000;
        const notes = buildNoteDescriptors(noteLines, gapSec);
        const preset = getScoringPreset(difficulty);

        // ── Score ALL players and build perPlayerScores ──
        const allScores: PlayerScoreEntry[] = [];
        let primaryResult: ReturnType<typeof scoreNotesWithPitchPoints> | null = null;
        let primaryScaled: { classicScore: number; bonusScore: number; totalScore: number } | null = null;
        let primarySegs: SegmentScore[] = [];
        const allSegScores: { [playerId: number]: SegmentScore[] } = {};
        const allCombos: { [playerId: number]: ComboState } = {};
        const allVerseRatings: { [playerId: number]: VerseRating[] } = {};
        const allTotalScores: { [playerId: number]: number } = {};
        const allNoteStats: { [playerId: number]: NoteStats } = {};

        const activePlayer = isPadMode
            ? players[0]
            : (players.find(p => !!p.micId) || players[0]);

        for (let idx = 0; idx < players.length; idx++) {
            const player = players[idx];
            const pts = player?.id != null ? (livePitch[player.id] || []) : [];
            if (pts.length === 0) {
                allScores.push({
                    id: player.id,
                    name: player.name || `Player ${player.id}`,
                    color: player.color || PLAYER_COLORS[idx % PLAYER_COLORS.length],
                    classicScore: 0,
                    bonusScore: 0,
                    totalScore: 0,
                });
                allSegScores[player.id] = [];
                allCombos[player.id] = { maxCombo: 0, currentCombo: 0, totalComboBonus: 0 };
                allVerseRatings[player.id] = [];
                allTotalScores[player.id] = 0;
                allNoteStats[player.id] = { hits: 0, misses: 0, good: 0, perfect: 0, maxCombo: 0 };
                continue;
            }

            const playerSettings = loadKaraokeSettings(player.id);
            const disableGold = !!playerSettings?.disableGoldNotes;
            const result = scoreNotesWithPitchPoints(notes, pts, {
                semitoneTolerance: preset.semitoneTolerance,
                preWindow: preset.preWindow,
                postExtra: preset.postExtra,
                difficultyMult: preset.difficultyMult,
                disableGoldNotes: disableGold,
            });
            const scaled = scaleResult(result, notes, disableGold);

            allScores.push({
                id: player.id,
                name: player.name || `Player ${player.id}`,
                color: player.color || PLAYER_COLORS[idx % PLAYER_COLORS.length],
                classicScore: scaled.classicScore,
                bonusScore: scaled.bonusScore,
                totalScore: scaled.totalScore,
            });

            // Build per-player maps for all players
            allSegScores[player.id] = buildSegmentScores(result.perNote, noteLines, gapSec);
            allCombos[player.id] = result.combo ?? { maxCombo: 0, currentCombo: 0, totalComboBonus: 0 };
            allVerseRatings[player.id] = result.verseRatings ?? [];
            allTotalScores[player.id] = scaled.totalScore;
            allNoteStats[player.id] = result.noteStats ?? { hits: 0, misses: 0, good: 0, perfect: 0, maxCombo: 0 };

            // Keep primary player results for liveScore/combo/verse etc.
            if (player.id === activePlayer?.id) {
                primaryResult = result;
                primaryScaled = scaled;
                primarySegs = allSegScores[player.id];
            }
        }

        setPerPlayerScores(allScores);
        setPerPlayerSegmentScores(allSegScores);
        setPerPlayerCombo(allCombos);
        setPerPlayerVerseRatings(allVerseRatings);
        setPerPlayerTotalScores(allTotalScores);
        setPerPlayerNoteStats(allNoteStats);

        if (primaryScaled) {
            setLiveScore(primaryScaled.classicScore);
            setLiveBonusScore(primaryScaled.bonusScore);
            setLiveTotalScore(primaryScaled.totalScore);
        } else {
            setLiveScore(0); setLiveBonusScore(0); setLiveTotalScore(0);
        }

        if (primaryResult) {
            scoreBus.push(primaryResult.total);
            if (primaryResult.combo) setLiveCombo(primaryResult.combo);
            if (primaryResult.verseRatings) setLiveVerseRatings(primaryResult.verseRatings);
            setLiveSegmentScores(primarySegs);
        } else {
            setLiveSegmentScores([]);
            setLiveCombo({ maxCombo: 0, currentCombo: 0, totalComboBonus: 0 });
            setLiveVerseRatings([]);
        }
    }, [livePitch, uploadedSong, isPlaying, difficulty, players, isPadMode]);

    return {
        liveScore,
        liveBonusScore,
        liveTotalScore,
        liveSegmentScores,
        liveCombo,
        liveVerseRatings,
        perPlayerScores,
        perPlayerSegmentScores,
        perPlayerCombo,
        perPlayerVerseRatings,
        perPlayerTotalScores,
        perPlayerNoteStats,
    };
}
