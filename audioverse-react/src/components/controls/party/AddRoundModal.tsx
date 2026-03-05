import React, { useState } from "react";
import { useTranslation } from 'react-i18next';
import { UseMutationResult } from "@tanstack/react-query";
import { KaraokeSongFile, KaraokePartyRound, KaraokeParty, KaraokePartyStatus } from "../../../models/modelsKaraoke";
import SongLookupModal from "../../common/SongLookupModal";
import { getSongCoverUrl, getSongYear, getSongGenre } from "../../../utils/songDataHelpers";

interface Props {
  show: boolean;
  onClose: () => void;
  songs: KaraokeSongFile[] | undefined;
  songsLoading: boolean;
  songIndex: number;
  setSongIndex: React.Dispatch<React.SetStateAction<number>>;
  addRoundMutation: UseMutationResult<KaraokePartyRound, unknown, KaraokePartyRound>;
  party: KaraokeParty;
  status: KaraokePartyStatus | undefined;
  /** Pre-set sessionId when adding rounds from within a session form */
  presetSessionId?: number | null;
}

/**
 * AddRoundModal — pick one or more songs, then create rounds for each.
 * Session picker removed; sessionId is set externally via presetSessionId.
 */
const AddRoundModal: React.FC<Props> = ({
  show, onClose, songs, songsLoading, songIndex: _songIndex, setSongIndex,
  addRoundMutation, party, status, presetSessionId,
}) => {
  const { t } = useTranslation();

  /* ── Multi-song list ── */
  const [selectedSongs, setSelectedSongs] = useState<KaraokeSongFile[]>([]);
  const [showLookup, setShowLookup] = useState(false);
  /** Which slot index is being edited (-1 = adding new) */
  const [editingIndex, setEditingIndex] = useState(-1);
  const [submitting, setSubmitting] = useState(false);

  if (!show) return null;

  /* Show the song lookup dialog */
  if (showLookup) {
    return (
      <SongLookupModal
        show
        onClose={() => {
          setShowLookup(false);
          if (selectedSongs.length === 0) onClose();
        }}
        songs={songs}
        songsLoading={songsLoading}
        onSelect={(song: KaraokeSongFile) => {
          if (editingIndex >= 0) {
            setSelectedSongs(prev => prev.map((s, i) => i === editingIndex ? song : s));
          } else {
            setSelectedSongs(prev => [...prev, song]);
          }
          setShowLookup(false);
          setEditingIndex(-1);
          const idx = songs?.findIndex(s => s.id === song.id) ?? -1;
          if (idx >= 0) setSongIndex(idx);
        }}
        initialMode="basic"
      />
    );
  }

  /* If no songs selected yet, go straight to lookup */
  if (selectedSongs.length === 0) {
    return (
      <SongLookupModal
        show
        onClose={onClose}
        songs={songs}
        songsLoading={songsLoading}
        onSelect={(song: KaraokeSongFile) => {
          setSelectedSongs([song]);
          setShowLookup(false);
          const idx = songs?.findIndex(s => s.id === song.id) ?? -1;
          if (idx >= 0) setSongIndex(idx);
        }}
        initialMode="basic"
      />
    );
  }

  const removeSong = (idx: number) => {
    setSelectedSongs(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!party || selectedSongs.length === 0) return;
    setSubmitting(true);
    try {
      const baseNumber = (status?.rounds?.length ?? 0) + 1;
      for (let i = 0; i < selectedSongs.length; i++) {
        const song = selectedSongs[i];
        const newRound = {
          partyId: party.id,
          eventId: party.id,
          playlistId: 0,
          songId: song.id ?? undefined,
          number: baseNumber + i,
        } as KaraokePartyRound;
        if (presetSessionId) newRound.sessionId = presetSessionId;
        await addRoundMutation.mutateAsync(newRound);
      }
      setSelectedSongs([]);
      onClose();
    } catch (_e) {
      // error handled by mutation
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="add-round-title"
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1080 }}
      onClick={onClose}>
      <div className="card shadow-lg" style={{ width: 500, maxWidth: '95%', borderRadius: 14, overflow: 'hidden' }}
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="card-header d-flex align-items-center justify-content-between"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <h5 id="add-round-title" className="mb-0 fw-bold">
            <i className="fa fa-plus-circle me-2" aria-hidden="true" />
            {t('addRound.title', 'Dodaj rundy')}
          </h5>
          <button className="btn-close" onClick={onClose} aria-label={t('common.close', 'Zamknij')} />
        </div>

        <div className="card-body">
          {/* Song list */}
          <div className="d-flex flex-column gap-2 mb-3">
            {selectedSongs.map((song, idx) => {
              const coverUrl = getSongCoverUrl(song);
              const genre = getSongGenre(song);
              const year = getSongYear(song);
              return (
                <div key={`${song.id}-${idx}`} className="d-flex align-items-center p-2 rounded-3"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <span className="badge bg-secondary me-2" style={{ width: 24, textAlign: 'center', flexShrink: 0, fontSize: 11 }}>{idx + 1}</span>
                  {coverUrl && (
                    <img src={coverUrl} alt={`Cover art for ${song.title}`} style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover', marginRight: 10, background: '#222', flexShrink: 0 }} />
                  )}
                  <div className="flex-grow-1" style={{ minWidth: 0 }}>
                    <div className="fw-bold text-truncate" style={{ fontSize: 13 }}>{song.title}</div>
                    <div className="text-muted small text-truncate">{song.artist}</div>
                  </div>
                  <div className="d-flex align-items-center gap-1">
                    {genre && (
                      <span className="badge" style={{ fontSize: 9, padding: '2px 6px', background: 'rgba(224,64,251,0.12)', color: '#e040fb', borderRadius: 4 }}>{genre}</span>
                    )}
                    {year && (
                      <span className="text-muted" style={{ fontSize: 10 }}>{year}</span>
                    )}
                    <button className="btn btn-sm p-0 ms-1" title={t('addRound.changeSong', 'Zmień piosenkę')}
                      onClick={() => { setEditingIndex(idx); setShowLookup(true); }}
                      style={{ lineHeight: 1 }}>
                      <i className="fa fa-pencil" style={{ fontSize: 11, opacity: 0.4 }} aria-hidden="true" />
                    </button>
                    <button className="btn btn-sm p-0 ms-1" title={t('common.remove', 'Usuń')}
                      onClick={() => removeSong(idx)}
                      style={{ lineHeight: 1 }}>
                      <i className="fa fa-times text-danger" style={{ fontSize: 11, opacity: 0.5 }} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add another song button — full width */}
          <button
            className="btn btn-outline-secondary w-100 d-flex align-items-center justify-content-center gap-2"
            style={{ borderStyle: 'dashed', borderRadius: 8, padding: '10px 0', fontSize: 13 }}
            onClick={() => { setEditingIndex(-1); setShowLookup(true); }}
          >
            <i className="fa fa-plus" aria-hidden="true" />
            {t('addRound.addAnotherSong', 'Dodaj kolejną piosenkę')}
          </button>
        </div>

        {/* Footer */}
        <div className="card-footer d-flex justify-content-end gap-2"
          style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <button className="btn btn-sm btn-outline-secondary" onClick={onClose}>
            {t('common.cancel', 'Anuluj')}
          </button>
          <button className="btn btn-sm btn-primary" onClick={handleSubmit} disabled={submitting || selectedSongs.length === 0}>
            <i className="fa fa-plus me-1" aria-hidden="true" />
            {t('addRound.addBtn', 'Dodaj rundy')}
            {selectedSongs.length > 1 && <span className="badge bg-light text-dark ms-1" style={{ fontSize: 10 }}>{selectedSongs.length}</span>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddRoundModal;
