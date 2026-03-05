import React, { useEffect, useMemo, useRef, useState, CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { List, type RowComponentProps, type ListImperativeAPI } from 'react-window';

interface NoteLine { lineIndex: number; start: number; duration: number; raw: string }

function parseUltrastarLines(text: string): NoteLine[] {
  const lines = (text || '').split(/\r?\n/);
  const notes: NoteLine[] = [];
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i].trim();
    if (!l) continue;
    // Handle standard (:), golden (*), and freestyle (F) note types
    if (/^[:*F]\s/.test(l)) {
      const parts = l.slice(1).trim().split(/\s+/);
      const startTenths = parseInt(parts[0] || '0', 10);
      const durTenths = parseInt(parts[1] || '0', 10);
      const start = (isNaN(startTenths) ? 0 : startTenths / 10);
      const duration = (isNaN(durTenths) ? 0 : durTenths / 10);
      notes.push({ lineIndex: i, start, duration, raw: lines[i] });
    }
  }
  return notes;
}

interface AnimationConfig {
  enabled?: boolean;
  durationMs?: number;
  translateX?: number;
  scale?: number;
  easing?: string;
  opacityInactive?: number;
  boxShadow?: string;
  scrollSmooth?: number;
  scrollEasing?: 'linear' | 'easeOutCubic';
}

interface Props {
  ultrastarText: string;
  audioUrl?: string | null;
  audioRef?: React.RefObject<HTMLAudioElement | null>;
  animationConfig?: AnimationConfig;
}

interface RowProps {
  lines: string[];
  notes: NoteLine[];
  currentIndex: number;
  animationConfig?: AnimationConfig;
}

/** Row component extracted outside render to enable memoization by react-window. */
const TimelineRow = ({ index, style, lines, notes, currentIndex, animationConfig }: RowComponentProps<RowProps>) => {
  const ln = lines[index] ?? '';
  const noteIdx = notes.findIndex(n => n.lineIndex === index);
  const isActive = noteIdx >= 0 && noteIdx === currentIndex;
  const enabled = animationConfig?.enabled ?? true;
  const durationMs = animationConfig?.durationMs ?? 300;
  const translateX = animationConfig?.translateX ?? 8;
  const scale = animationConfig?.scale ?? 1.01;
  const easing = animationConfig?.easing ?? 'cubic-bezier(.22,1,.36,1)';
  const opacityInactive = animationConfig?.opacityInactive ?? 0.9;
  const boxShadow = animationConfig?.boxShadow ?? '0 6px 18px rgba(3,102,214,0.08)';

  const animStyle: CSSProperties = {
    transition: enabled ? `transform ${durationMs}ms ${easing}, opacity ${durationMs}ms ${easing}` : 'none',
    transform: isActive ? `translateX(${translateX}px) scale(${scale})` : 'translateX(0px) scale(1)',
    opacity: isActive ? 1 : opacityInactive,
    boxShadow: isActive ? boxShadow : 'none',
  };
  return (
    <div style={{ ...style, padding: '4px 6px', borderRadius: 4 }} data-note-idx={noteIdx >= 0 ? noteIdx : undefined}>
      <div style={{ ...animStyle, background: isActive ? 'rgba(0,130,200,0.12)' : 'transparent', padding: '4px 6px', borderRadius: 4 }}>
        <code style={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>{ln}</code>
      </div>
    </div>
  );
};

const KaraokeEditorManager: React.FC<Props> = ({ ultrastarText, audioUrl, audioRef: externalAudioRef, animationConfig }) => {
  const { t } = useTranslation();
  const internalAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioRef = externalAudioRef ?? internalAudioRef;
  const [playing, setPlaying] = useState(false);
  const notes = useMemo(() => parseUltrastarLines(ultrastarText), [ultrastarText]);

  const listRef = useRef<ListImperativeAPI>(null);

  // Performance refs
  const rafRef = useRef<number | null>(null);
  const timeRef = useRef<number>(0);
  const currentOffsetRef = useRef<number>(0);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);

  const LINES = useMemo(() => (ultrastarText || '').split(/\r?\n/), [ultrastarText]);
  const ITEM_HEIGHT = 28; // px per line
  const totalHeight = LINES.length * ITEM_HEIGHT;

  // Row props for react-window (memoized to avoid unnecessary re-renders)
  const rowProps: RowProps = useMemo(() => ({
    lines: LINES,
    notes,
    currentIndex,
    animationConfig,
  }), [LINES, notes, currentIndex, animationConfig]);

  // play/pause synchronization with audio element
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) audio.play().catch(() => setPlaying(false));
    else audio.pause();
  }, [playing, audioRef]);

  // RAF loop to poll audio.currentTime and update currentIndex + time-based smoothing scroll
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    let lastIndex = -1;
    const conf = animationConfig ?? null;
    const BASE_SMOOTH = (conf && typeof conf.scrollSmooth === 'number') ? conf.scrollSmooth : 0.18;

    let lastTime = performance.now();
    const loop = () => {
      const now = performance.now();
      const dt = Math.max(0, Math.min(0.2, (now - lastTime) / 1000));
      lastTime = now;

      const ct = audio.currentTime || 0;
      timeRef.current = ct;
      // compute active note index
      let idx = -1;
      for (let i = 0; i < notes.length; i++) {
        const n = notes[i];
        if (ct >= n.start && ct < n.start + Math.max(0.001, n.duration)) { idx = i; break; }
      }
      if (idx !== lastIndex) {
        lastIndex = idx;
        setCurrentIndex(idx);
      }

      // compute target scroll offset (center the corresponding line)
      let targetOffset = 0;
      if (lastIndex >= 0) {
        const lineIdx = notes[lastIndex]?.lineIndex ?? 0;
        const containerH = listRef.current?.element?.clientHeight ?? 220;
        targetOffset = lineIdx * ITEM_HEIGHT - containerH / 2 + ITEM_HEIGHT / 2;
        const maxScroll = Math.max(0, totalHeight - containerH);
        if (isNaN(targetOffset) || !isFinite(targetOffset)) targetOffset = 0;
        targetOffset = Math.max(0, Math.min(targetOffset, maxScroll));
      }

      // time-based smoothing
      const rawFactor = 1 - Math.pow(Math.max(0, 1 - BASE_SMOOTH), Math.min(4, dt * 60));
      const easingMode = animationConfig?.scrollEasing || 'easeOutCubic';
      const easeOutCubic = (v: number) => 1 - Math.pow(1 - v, 3);
      const easingFunc = easingMode === 'linear' ? ((v: number) => v) : easeOutCubic;
      const factor = easingFunc(rawFactor);
      currentOffsetRef.current = currentOffsetRef.current + (targetOffset - currentOffsetRef.current) * factor;

      // apply to list element
      try {
        const elem = listRef.current?.element;
        if (elem && typeof elem.scrollTop === 'number') elem.scrollTop = Math.round(currentOffsetRef.current);
      } catch { /* ignore scroll errors */ }

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [audioRef, notes, totalHeight, animationConfig, listRef]);

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
        <button onClick={() => setPlaying(p => !p)} disabled={!audioUrl}>{playing ? 'Pause' : 'Play'}</button>
        <div style={{ fontSize: 13, color: '#666' }}>{(timeRef.current || 0).toFixed(2)}s</div>
        <div style={{ marginLeft: 'auto', fontSize: 13, color: '#666' }}>Notes: {notes.length}</div>
      </div>
      <div style={{ border: '1px solid #ddd', height: 220, overflow: 'hidden', padding: 8, position: 'relative' }}>
        {ultrastarText ? (
          <List
            defaultHeight={220}
            rowCount={LINES.length}
            rowHeight={ITEM_HEIGHT}
            listRef={listRef}
            rowComponent={TimelineRow}
            rowProps={rowProps}
            style={{ width: '100%' }}
          />
        ) : (
          <div style={{ color: '#888' }}>{t('karaokeEditor.noText', 'No text')}</div>
        )}
      </div>
      {!externalAudioRef && (
        <audio ref={internalAudioRef} src={audioUrl || undefined} preload="metadata" style={{ display: 'none' }} />
      )}
    </div>
  );
};

export default KaraokeEditorManager;
