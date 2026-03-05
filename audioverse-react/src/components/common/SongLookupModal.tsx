/**
 * SongLookupModal — Song-specific wrapper around the generic LookupModal.
 *
 * Configures filters (genre, year, language), display accessors (title, artist,
 * cover image, genre badge, year), and auto-fetches songs via useAllSongsQuery
 * when no external list is provided.
 */
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { KaraokeSongFile } from "../../models/modelsKaraoke";
import { useAllSongsQuery } from "../../scripts/api/apiKaraoke";
import LookupModal, { type LookupMode, type LookupFilterDef } from "./LookupModal";
import { getSongCoverUrl, getSongYear, getSongGenre } from "../../utils/songDataHelpers";

export type { LookupMode };

export interface SongLookupModalProps {
    show: boolean;
    onClose: () => void;
    onSelect: (song: KaraokeSongFile) => void;
    onInfo?: (song: KaraokeSongFile) => void;
    /** Songs to display. If omitted, fetches via useAllSongsQuery */
    songs?: KaraokeSongFile[];
    songsLoading?: boolean;
    initialMode?: LookupMode;
}

const SongLookupModal: React.FC<SongLookupModalProps> = ({
    show,
    onClose,
    onSelect,
    onInfo,
    songs: externalSongs,
    songsLoading: externalLoading,
    initialMode = "basic",
}) => {
    const { t } = useTranslation();

    /* ── Auto-fetch when no external songs provided ── */
    const { data: queriedSongs, isLoading: queryLoading } = useAllSongsQuery();
    const allSongs = externalSongs ?? queriedSongs ?? [];
    const isLoading = externalLoading ?? queryLoading;

    /* ── Song-specific filter definitions ── */
    const filters: LookupFilterDef<KaraokeSongFile>[] = useMemo(() => [
        {
            id: "genre",
            label: t('songLookup.byGenre', 'Wg gatunku'),
            allLabel: t('songLookup.allGenres', 'Gatunek: Wszystkie'),
            icon: "🎸",
            color: "#e040fb",
            getValue: (s) => getSongGenre(s),
        },
        {
            id: "year",
            label: t('songLookup.byYear', 'Wg roku'),
            allLabel: t('songLookup.allYears', 'Rok: Wszystkie'),
            icon: "📅",
            color: "#ffa726",
            getValue: (s) => getSongYear(s) || undefined,
            sortValues: (a, b) => Number(b) - Number(a),
        },
        {
            id: "language",
            label: t('songLookup.byLanguage', 'Wg języka'),
            allLabel: t('songLookup.allLanguages', 'Język: Wszystkie'),
            icon: "🌍",
            color: "#66bb6a",
            getValue: (s) => s.language || undefined,
        },
    ], [t]);

    return (
        <LookupModal<KaraokeSongFile>
            show={show}
            onClose={onClose}
            onSelect={onSelect}
            onInfo={onInfo}
            items={allSongs}
            isLoading={isLoading}
            initialMode={initialMode}
            title={t('songLookup.title', 'Wybierz piosenkę')}
            titleIcon="fa fa-music"
            searchPlaceholder={t('songLookup.searchPlaceholder', 'Szukaj tytuł, wykonawca...')}
            itemsLabel={t('songLookup.itemsLabel', 'piosenek')}
            filters={filters}
            getId={(s) => s.id ?? 0}
            getTitle={(s) => s.title}
            getSubtitle={(s) => s.artist}
            getImage={(s) => getSongCoverUrl(s)}
            getBadges={(s) => {
                const badges: { label: string; color: string }[] = [];
                const genre = getSongGenre(s);
                if (genre) badges.push({ label: genre, color: "#e040fb" });
                return badges;
            }}
            getExtra={(s) => { const y = getSongYear(s); return y ? String(y) : undefined; }}
            getSearchText={(s) => `${s.title} ${s.artist} ${s.genre ?? ''}`}
            idPrefix="slookup-"
        />
    );
};

export default SongLookupModal;
