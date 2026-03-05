import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import AudioTab, { AudioHandle } from "./AudioTab";
import type { SongMetadata } from "./SongMetadataLookup";
import NotesTab, { NotesHandle } from "./NotesTab";
import { PLAYER_COLORS } from '../../constants/playerColors';
import TextTab, { TextHandle } from "./TextTab";
import ExportTab from "./ExportTab";
import { useUltrastarSongsQuery } from '../../scripts/api/apiLibraryUltrastar';
import { fetchSongById } from '../../scripts/api/apiKaraoke';
import { useYouTubeSearchQuery } from '../../scripts/api/apiLibrary';
import type { KaraokeSongFile } from '../../models/modelsKaraoke';
import { logger } from '../../utils/logger';

const log = logger.scoped('EditorShell');

/** Shape of a note entry stored in a backup file. */
interface BackupNote {
  start?: number;
  duration?: number;
  pitch?: number;
}

/** Shape of the JSON backup file produced / consumed by this editor. */
interface BackupData {
  ultrastarText?: string;
  savedAt?: string;
  audioFileName?: string;
  audioDataUrl?: string;
  audioUrl?: string;
  notes?: BackupNote[];
}

const TABS = ["Audio", "Notes", "Text", "Export"];

const YouTubeSection: React.FC<{ artist: string; title: string }> = ({ artist, title }) => {
  const { t } = useTranslation();
  const { data: videoId, isLoading } = useYouTubeSearchQuery(artist, title);
  if (!artist || !title) return null;
  return (
    <div style={{ marginTop: 16, padding: 12, border: '1px solid var(--border-color, #e2e8f0)', borderRadius: 8 }}>
      <h4>{t('editor.youtubePreview')}</h4>
      {isLoading && <div>{t('common.loading')}</div>}
      {videoId && (
        <iframe
          width="100%"
          height="315"
          src={`https://www.youtube.com/embed/${videoId}`}
          title={t('editor.youtubePlayerTitle', 'YouTube video player')}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{ maxWidth: 560, borderRadius: 8 }}
        />
      )}
      {!isLoading && !videoId && <div style={{ color: 'var(--text-secondary, #94a3b8)' }}>{t('editor.youtubeNotFound')}</div>}
    </div>
  );
};

const EditorShell: React.FC = () => {
  const { t } = useTranslation();
  const { songIdParam } = useParams<{ songIdParam?: string }>();
  const [tab, setTab] = useState(0);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<string>("pitchy");
  const [ultrastarText, setUltrastarText] = useState<string>("");
  const [songId, setSongId] = useState<number | null>(null);
  const notesRef = useRef<NotesHandle | null>(null);
  const audioRef = useRef<AudioHandle | null>(null);
  const textRef = useRef<TextHandle | null>(null);
  const playerAudioRef = useRef<HTMLAudioElement | null>(null);
  const [restoreToast, setRestoreToast] = useState<string | null>(null);
  const restoreTimer = useRef<number | null>(null);
  const restoreInputRef = useRef<HTMLInputElement | null>(null);
  const [parsedBackup, setParsedBackup] = useState<BackupData | null>(null);
  const [showSongBrowser, setShowSongBrowser] = useState(false);
  const [songFilter, setSongFilter] = useState('');
  const [loadedSongMeta, setLoadedSongMeta] = useState<{ artist: string; title: string } | null>(null);
  const { data: ultrastarSongs = [] } = useUltrastarSongsQuery({ enabled: showSongBrowser });

  const loadSong = useCallback(async (id: number) => {
    try {
      const song = await fetchSongById(id);
      setSongId(song.id ?? id);
      const headerLines: string[] = [];
      if (song.title) headerLines.push(`#TITLE:${song.title}`);
      if (song.artist) headerLines.push(`#ARTIST:${song.artist}`);
      if (song.bpm) headerLines.push(`#BPM:${song.bpm}`);
      if (song.gap != null) headerLines.push(`#GAP:${song.gap}`);
      if (song.videoGap != null) headerLines.push(`#VIDEOGAP:${song.videoGap}`);
      if (song.genre) headerLines.push(`#GENRE:${song.genre}`);
      if (song.language) headerLines.push(`#LANGUAGE:${song.language}`);
      if (song.year) headerLines.push(`#YEAR:${song.year}`);
      if (song.videoPath) headerLines.push(`#VIDEO:${song.videoPath}`);
      if (song.coverPath) headerLines.push(`#COVER:${song.coverPath}`);
      if (song.audioPath) headerLines.push(`#MP3:${song.audioPath}`);
      const noteLines = song.notes?.map((n: { noteLine: string }) => n.noteLine) ?? [];
      const text = [...headerLines, ...noteLines, 'E'].join('\n');
      setUltrastarText(text);
      setLoadedSongMeta({ artist: song.artist ?? '', title: song.title ?? '' });
      setShowSongBrowser(false);
      setRestoreToast(t('editor.songLoaded'));
      if (restoreTimer.current) window.clearTimeout(restoreTimer.current);
      restoreTimer.current = window.setTimeout(() => setRestoreToast(null), 1800) as unknown as number;
    } catch (e) {
      log.warn('Failed to load song', e);
      setRestoreToast(t('editor.songLoadFailed'));
      if (restoreTimer.current) window.clearTimeout(restoreTimer.current);
      restoreTimer.current = window.setTimeout(() => setRestoreToast(null), 1800) as unknown as number;
    }
  }, [t]);

  useEffect(() => {
    if (songIdParam) {
      const id = Number(songIdParam);
      if (Number.isFinite(id) && id > 0) {
        loadSong(id);
      }
    }
  }, [songIdParam, loadSong]);

  /** Apply metadata from SongMetadataLookup into UltraStar headers. */
  const handleMetadataApply = (meta: SongMetadata) => {
    setUltrastarText(prev => {
      // Remove existing matching headers, then prepend new ones
      const lines = prev.split('\n');
      const headerKeys = ['#TITLE:', '#ARTIST:', '#ALBUM:', '#GENRE:', '#YEAR:', '#BPM:', '#COVER:'];
      const nonHeader = lines.filter(l => !headerKeys.some(h => l.startsWith(h)));
      const newHeaders: string[] = [];
      if (meta.title) newHeaders.push(`#TITLE:${meta.title}`);
      if (meta.artist) newHeaders.push(`#ARTIST:${meta.artist}`);
      if (meta.album) newHeaders.push(`#ALBUM:${meta.album}`);
      if (meta.genre) newHeaders.push(`#GENRE:${meta.genre}`);
      if (meta.year) newHeaders.push(`#YEAR:${meta.year}`);
      if (meta.bpm) newHeaders.push(`#BPM:${meta.bpm}`);
      if (meta.spotifyCoverUrl) newHeaders.push(`#COVER:${meta.spotifyCoverUrl}`);
      return [...newHeaders, ...nonHeader].join('\n');
    });
    setLoadedSongMeta({ artist: meta.artist ?? '', title: meta.title ?? '' });
  };

  const createFullBackup = async () => {
    const payload: BackupData = { ultrastarText, savedAt: new Date().toISOString() };
    if (audioFile) {
      try {
        const dataUrl: string = await new Promise((resolve, reject) => {
          const fr = new FileReader();
          fr.onload = () => resolve(fr.result as string);
          fr.onerror = (e) => reject(e);
          fr.readAsDataURL(audioFile);
        });
        payload.audioFileName = audioFile.name;
        payload.audioDataUrl = dataUrl;
      } catch (e) {
        log.warn('Failed to read audio file for backup', e);
      }
    }
    if (ultrastarText) payload.ultrastarText = ultrastarText;
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audioverse-full-backup-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setRestoreToast(t('editor.backupSaved'));
    if (restoreTimer.current) window.clearTimeout(restoreTimer.current);
    restoreTimer.current = window.setTimeout(() => setRestoreToast(null), 1800) as unknown as number;
  };

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      // Global undo/redo/save shortcuts
      const isCmd = ev.ctrlKey || ev.metaKey;
      if (!isCmd) return;
      if (ev.key === 'z' || ev.key === 'Z') {
        ev.preventDefault();
        if (ev.shiftKey) {
          if (tab === 1) notesRef.current?.redo();
        } else {
          if (tab === 1) notesRef.current?.undo();
        }
      } else if (ev.key === 'y' || ev.key === 'Y') {
        ev.preventDefault();
        if (tab === 1) notesRef.current?.redo();
      } else if (ev.key === 's' || ev.key === 'S') {
        ev.preventDefault();
        if (tab === 0) audioRef.current?.save();
        else if (tab === 1) notesRef.current?.save();
        else if (tab === 2) textRef.current?.save();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [tab]);

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: 24 }}>
      {restoreToast && (
        <div style={{ position: 'fixed', right: 24, top: 72, background: 'var(--overlay-bg, rgba(0,0,0,0.85))', color: 'var(--btn-text, #fff)', padding: '8px 12px', borderRadius: 6, zIndex: 9999 }}>
          {restoreToast}
        </div>
      )}
      <h2>{t('editor.ultrastarEditorTitle')}</h2>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button onClick={() => restoreInputRef.current?.click()}>{t('editor.restoreBackup')}</button>
        <button onClick={() => createFullBackup()} style={{ marginLeft: 'auto' }}>{t('editor.saveFullBackup')}</button>
        <button onClick={() => setShowSongBrowser(true)} style={{ background: 'var(--accent, #3b82f6)', color: 'var(--btn-text, #fff)', border: 'none', borderRadius: 6, padding: '8px 14px', cursor: 'pointer' }}>{t('editor.browseSongs')}</button>
        <input ref={restoreInputRef} type="file" accept=".json,.txt" style={{ display: 'none' }} onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          try {
            const text = await f.text();
            // try parse JSON first
            let parsed: BackupData | null = null;
            try { parsed = JSON.parse(text); } catch (_err) { parsed = null; }
            if (parsed && typeof parsed === 'object') {
              // hold parsed backup and show selective options
              setParsedBackup(parsed);
            } else {
              // treat as plain Ultrastar text
              setUltrastarText(text);
              setRestoreToast(t('editor.textRestored'));
              if (restoreTimer.current) window.clearTimeout(restoreTimer.current);
              restoreTimer.current = window.setTimeout(() => setRestoreToast(null), 1800) as unknown as number;
            }
          } catch (err) {
            log.warn('Restore failed', err);
          } finally {
            // clear input
            if (restoreInputRef.current) restoreInputRef.current.value = '';
          }
        }} />
        {parsedBackup && (
          <div style={{ padding: 8, border: '1px solid var(--border-subtle, #ccc)', borderRadius: 6, display: 'inline-block', marginLeft: 8 }}>
            <div style={{ marginBottom: 6 }}>{t('editor.backupSelectPrompt')}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={async () => {
                const p = parsedBackup;
                if (p.ultrastarText) { setUltrastarText(p.ultrastarText); }
                if (p.audioDataUrl) {
                  try { const fetched = await fetch(p.audioDataUrl); const blob = await fetched.blob(); const filename = p.audioFileName || 'restored-audio'; const file = new File([blob], filename, { type: blob.type || 'audio/*' }); setAudioFile(file); const url = URL.createObjectURL(file); setAudioUrl(url); }
                  catch (err) { log.warn('restore audio failed', err); }
                } else if (p.audioUrl) { setAudioUrl(p.audioUrl); }
                setParsedBackup(null);
                setRestoreToast(t('editor.fullBackupRestored'));
                if (restoreTimer.current) window.clearTimeout(restoreTimer.current);
                restoreTimer.current = window.setTimeout(() => setRestoreToast(null), 1800) as unknown as number;
              }}>{t('editor.applyAll')}</button>
              <button onClick={async () => {
                const p = parsedBackup; if (p.audioDataUrl) { try { const fetched = await fetch(p.audioDataUrl); const blob = await fetched.blob(); const filename = p.audioFileName || 'restored-audio'; const file = new File([blob], filename, { type: blob.type || 'audio/*' }); setAudioFile(file); const url = URL.createObjectURL(file); setAudioUrl(url); setRestoreToast(t('editor.audioRestored')); }
                catch (err) { log.warn('restore audio failed', err); }
                } else if (p.audioUrl) { setAudioUrl(p.audioUrl); setRestoreToast(t('editor.audioUrlRestored')); }
                setParsedBackup(null);
                if (restoreTimer.current) window.clearTimeout(restoreTimer.current);
                restoreTimer.current = window.setTimeout(() => setRestoreToast(null), 1800) as unknown as number;
              }}>{t('editor.audioOnly')}</button>
              <button onClick={() => { const p = parsedBackup; if (p.ultrastarText) { setUltrastarText(p.ultrastarText); setRestoreToast(t('editor.textRestored')); } else if (p.notes) { const header = `#TITLE:Restored\n#ARTIST:Restore`; const lines = (p.notes as BackupNote[]).map(n => `: ${Math.round((n.start||0) * 10)} ${Math.round((n.duration||0) * 10)} ${n.pitch||48}`); setUltrastarText(`${header}\n${lines.join("\n")}\nE`); setRestoreToast(t('editor.notesRestored')); } setParsedBackup(null); if (restoreTimer.current) window.clearTimeout(restoreTimer.current);
                restoreTimer.current = window.setTimeout(() => setRestoreToast(null), 1800) as unknown as number; }}>{t('editor.textOnly')}</button>
              <button onClick={() => setParsedBackup(null)} style={{ marginLeft: 8 }}>{t('common.cancel')}</button>
            </div>
          </div>
        )}
        {TABS.map((tabName, i) => (
          <button
            key={tabName}
            onClick={() => setTab(i)}
            style={{
              padding: "8px 14px",
              borderRadius: 6,
              border: tab === i ? "2px solid var(--accent-primary, #007bff)" : "1px solid var(--border-subtle, #ccc)",
              background: tab === i ? "var(--accent-light, #e6f0ff)" : "var(--card-bg, #fff)",
              cursor: "pointer",
            }}
          >
            {t(`editor.tab${tabName}`)}
          </button>
        ))}
      </div>

      <div style={{ minHeight: 360 }}>
        {tab === 0 && (
          <AudioTab
            ref={audioRef as React.Ref<AudioHandle>}
            audioFile={audioFile}
            audioUrl={audioUrl}
            setAudioFile={setAudioFile}
            setAudioUrl={setAudioUrl}
            selectedAlgorithm={selectedAlgorithm}
            setSelectedAlgorithm={(a) => setSelectedAlgorithm(a)}
            setUltrastarText={(t) => { setUltrastarText(t); }}
            setActiveTab={(i: number) => setTab(i)}
            onMetadataApply={handleMetadataApply}
          />
        )}
        {tab === 1 && <NotesTab ref={notesRef} audioUrl={audioUrl} audioRef={playerAudioRef} playerColor={PLAYER_COLORS[0]} ultrastarText={ultrastarText} setUltrastarText={setUltrastarText} />}
        {tab === 2 && (
          <TextTab
            ref={textRef as React.Ref<TextHandle>}
            ultrastarText={ultrastarText}
            setUltrastarText={setUltrastarText}
            songId={songId}
            setSongId={(id: number | null) => setSongId(id)}
          />
        )}
        {tab === 3 && <ExportTab ultrastarText={ultrastarText} audioUrl={audioUrl} audioFile={audioFile} audioRef={playerAudioRef} songId={songId} />}
      </div>

      {/* YouTube preview section */}
      {loadedSongMeta && loadedSongMeta.artist && loadedSongMeta.title && (
        <YouTubeSection artist={loadedSongMeta.artist} title={loadedSongMeta.title} />
      )}

      {/* Song browser modal */}
      {showSongBrowser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowSongBrowser(false)}>
          <div style={{ background: 'var(--card-bg, #fff)', borderRadius: 12, padding: 24, width: '90%', maxWidth: 600, maxHeight: '80vh', display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>{t('editor.songBrowserTitle')}</h3>
            <input
              type="text"
              placeholder={t('editor.songBrowserSearch')}
              value={songFilter}
              onChange={(e) => setSongFilter(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-color, #d1d5db)', marginBottom: 12, fontSize: 14 }}
              autoFocus
            />
            <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
              {(() => {
                const filtered = ultrastarSongs.filter((s: KaraokeSongFile) => {
                  if (!songFilter) return true;
                  const q = songFilter.toLowerCase();
                  return (s.title?.toLowerCase().includes(q) || s.artist?.toLowerCase().includes(q));
                });
                if (!filtered.length) return <div style={{ padding: 12, color: 'var(--text-secondary, #94a3b8)' }}>{t('editor.songBrowserEmpty')}</div>;
                return filtered.map((s: KaraokeSongFile, i: number) => (
                  <div key={s.id ?? i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 4px', borderBottom: '1px solid var(--border-subtle, #f1f5f9)' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{s.title ?? t('editor.noTitle', '(no title)')}</div>
                      <div style={{ color: 'var(--text-secondary, #64748b)', fontSize: 12 }}>{s.artist ?? ''}</div>
                    </div>
                    <button
                      onClick={() => { if (s.id != null) loadSong(s.id); }}
                      disabled={s.id == null}
                      style={{ background: 'var(--accent, #3b82f6)', color: 'var(--btn-text, #fff)', border: 'none', borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontSize: 13 }}
                    >
                      {t('editor.songBrowserLoad')}
                    </button>
                  </div>
                ));
              })()}
            </div>
            <button onClick={() => setShowSongBrowser(false)} style={{ marginTop: 12, alignSelf: 'flex-end', padding: '8px 18px', borderRadius: 6, border: '1px solid var(--border-color, #d1d5db)', background: 'var(--card-bg, #fff)', cursor: 'pointer' }}>
              {t('editor.songBrowserClose')}
            </button>
          </div>
        </div>
      )}

      {/* shared hidden player for previews — used by ExportTab previews and Phaser renderer */}
      <audio ref={playerAudioRef} src={audioUrl || undefined} preload="metadata" style={{ display: 'none' }} />
    </div>
  );
};

export default EditorShell;
