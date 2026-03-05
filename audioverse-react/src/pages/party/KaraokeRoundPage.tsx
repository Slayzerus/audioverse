import React, { useMemo, useEffect } from "react";
import { useLocation, Link, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "bootstrap/dist/css/bootstrap.min.css";
import KaraokeManager from "../../components/controls/karaoke/KaraokeManager.tsx";
import { useSongQuery } from "../../scripts/api/karaoke/apiKaraokeSongs";
import { useEventParticipantsQuery } from "../../scripts/api/apiEvents";
import { useUser } from "../../contexts/UserContext";
import { logger } from "../../utils/logger";
import { dkLog } from "../../constants/debugKaraoke";
const log = logger.scoped('KaraokeRoundPage');

const KaraokeRoundPage: React.FC = () => {
    const { t } = useTranslation();
    const location = useLocation();
    const { userId } = useUser();
    const stateSong = location.state?.song;
    const gameMode = location.state?.gameMode || "normal";
    const roundId = location.state?.roundId ?? null;
    const roundPartId = location.state?.roundPartId ?? null;
    const partyId = location.state?.partyId ?? null;
    const partyName = location.state?.partyName ?? null;

    useEffect(() => {
        dkLog('ROUND-PAGE', `► Otwieram stronę karaoke — piosenka: "${stateSong?.title ?? '?'}" (id=${stateSong?.id ?? '?'}), tryb: ${gameMode}, roundId=${roundId ?? 'brak'}, partyId=${partyId ?? 'brak'}`);
    }, []);

    // ── Participant guard: block non-participants when partyId is set ──
    // Uses the dedicated participants endpoint which returns EventParticipant[]
    // with userId and user navigation — so we can match by userId correctly.
    const { data: participantsRaw = [], isLoading: participantsLoading } = useEventParticipantsQuery(
        partyId!, { enabled: partyId != null },
    );
    const isParticipant = useMemo(() => {
        if (partyId == null) return true; // no party context → allow
        if (participantsLoading) return undefined; // still loading
        if (userId == null) return false;
        // Match by userId (event-level participant)
        return participantsRaw.some((pp) => {
            return pp.userId === userId || (pp.user?.id === userId);
        });
    }, [partyId, participantsRaw, participantsLoading, userId]);

    if (partyId != null && participantsLoading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 200 }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">{t("common.loading", "Loading...")}</span>
                </div>
            </div>
        );
    }
    if (partyId != null && isParticipant === false) {
        log.warn('User', userId, 'not found in participants for party', partyId, participantsRaw);
        return <Navigate to={`/parties/${partyId}`} replace />
    }

    // If location.state only carries a minimal song stub (id + title/artist),
    // fetch the full KaraokeSongFile from the API so we get videoPath, notes,
    // audioPath etc. without a redundant YouTube search.
    const songId: number | undefined = stateSong?.id;
    // Simplify stub detection: always fetch when notes are missing, regardless of videoPath
    const isMinimalStub = songId != null && !(stateSong?.notes?.length);
    const { data: fullSong, isLoading: songLoading } = useSongQuery(songId!, { enabled: isMinimalStub && Number.isFinite(songId) });

    // Prefer full API data; fall back to whatever location.state carried.
    const song = useMemo(() => {
        if (isMinimalStub && fullSong) return fullSong as unknown as Record<string, unknown>;
        return stateSong;
    }, [isMinimalStub, fullSong, stateSong]);

    // Diagnostic logging
    log.debug('state:', {
        songId, roundId, partyId, isMinimalStub, songLoading,
        stateSongKeys: stateSong ? Object.keys(stateSong) : null,
        fullSongNotes: fullSong?.notes?.length ?? 0,
        resolvedSongNotes: (song as Record<string, unknown>)?.notes
            ? ((song as Record<string, unknown>).notes as unknown[]).length
            : 0,
        resolvedSongVideoPath: (song as Record<string, unknown>)?.videoPath,
        resolvedSongYoutubeId: (song as Record<string, unknown>)?.youtubeId,
    });

    if (isMinimalStub && songLoading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 200 }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">{t("common.loading", "Loading...")}</span>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* Breadcrumb navigation */}
            <nav className="karaoke-breadcrumb" style={{ padding: "8px 16px", fontSize: 13, opacity: 0.8, display: "flex", gap: 6, alignItems: "center" }}>
                <Link to="/play" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>{t("nav.playHub")}</Link>
                <span style={{ color: "var(--text-secondary)" }}>›</span>
                {partyId ? (
                    <>
                        <Link to={`/parties/${partyId}`} style={{ color: "var(--text-secondary)", textDecoration: "none" }}>
                            {partyName || t("karaokeRound.partyFallback", { id: partyId })}
                        </Link>
                        <span style={{ color: "var(--text-secondary)" }}>›</span>
                    </>
                ) : null}
                <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>
                    {roundId ? t("karaokeRound.roundFallback", { id: roundId }) : t("karaokeRound.karaoke")}
                </span>
            </nav>
            <KaraokeManager showJurors={false} initialSong={song} gameMode={gameMode} initialRoundId={roundId} initialRoundPartId={roundPartId} initialPartyId={partyId} />
        </>
    );
};

export default KaraokeRoundPage;
