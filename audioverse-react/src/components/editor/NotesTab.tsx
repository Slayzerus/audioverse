import React, { useEffect, useRef, useState, useImperativeHandle } from "react";
import { useToast } from "../ui/ToastProvider";
import { useTranslation } from 'react-i18next';
import { resolveCssColor, parseColorToRgb } from "../../utils/colorResolver";
import { logger } from "../../utils/logger";
const log = logger.scoped('NotesTab');

interface Note {
  start: number; // seconds
  duration: number; // seconds
  pitch: number; // integer pitch id (Ultrastar numeric)
  lyric?: string;
}

interface Props {
  audioUrl: string | null;
  ultrastarText: string;
  setUltrastarText: (t: string) => void;
  audioRef?: React.RefObject<HTMLAudioElement | null>;
  playerColor?: string;
}

/** Extract header lines (starting with #) from Ultrastar text. */
const extractHeaders = (text: string): string[] => {
  return text.split(/\r?\n/).filter(l => l.trim().startsWith('#'));
};

const parseUltrastarToNotes = (text: string): Note[] => {
  const lines = text.split(/\r?\n/);
  const notes: Note[] = [];
  for (const l of lines) {
    const t = l.trim();
    if (!t) continue;
    // Handle standard (:), golden (*), and freestyle (F) note types
    const noteMatch = t.match(/^([:*F])\s+(.+)/);
    if (noteMatch) {
      const parts = noteMatch[2].split(/\s+/);
      if (parts.length >= 3) {
        const startTenths = parseInt(parts[0], 10);
        const durTenths = parseInt(parts[1], 10);
        const pitch = parseInt(parts[2], 10);
        const lyric = parts.slice(3).join(' ') || '';
        if (!Number.isNaN(startTenths) && !Number.isNaN(durTenths) && !Number.isNaN(pitch)) {
          notes.push({ start: startTenths / 10, duration: durTenths / 10, pitch, lyric });
        }
      }
    }
  }
  return notes;
};

/** Rebuild Ultrastar text from notes, preserving existing headers. */
const notesToUltrastar = (notes: Note[], existingText?: string) => {
  const headers = existingText ? extractHeaders(existingText) : [];
  if (headers.length === 0) {
    headers.push('#TITLE:Edited', '#ARTIST:Editor');
  }
  const lines = notes.map(n => `: ${Math.round(n.start * 10)} ${Math.round(n.duration * 10)} ${n.pitch}${n.lyric ? ' ' + n.lyric : ''}`);
  return `${headers.join('\n')}\n${lines.join('\n')}\nE`;
};

export type NotesHandle = {
  undo: () => void;
  redo: () => void;
  save: () => void;
};

const NotesTab = React.forwardRef<NotesHandle, Props>(({ audioUrl, ultrastarText, setUltrastarText, audioRef, playerColor }, ref) => {
  const [notes, setNotes] = useState<Note[]>(() => parseUltrastarToNotes(ultrastarText));
  const undoStack = useRef<Note[][]>([]);
  const redoStack = useRef<Note[][]>([]);
  const { showToast } = useToast();
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ultrastarTextRef = useRef<string>(ultrastarText);
  ultrastarTextRef.current = ultrastarText;
  const [duration, setDuration] = useState<number>(30);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const dragState = useRef<{ mode: 'none' | 'move' | 'resize'; side?: 'left' | 'right'; startX: number; origNote?: Note; }>({ mode: 'none', startX: 0 });
  const [playhead, setPlayhead] = useState<number>(0);
  const [hover, setHover] = useState<{ idx: number; part: 'edge-left' | 'edge-right' | 'body' | 'none' } | null>(null);
  const [snapEnabled, setSnapEnabled] = useState<boolean>(true);
  const [snapValue, setSnapValue] = useState<number>(0.25); // seconds
  const [snapToBeat, setSnapToBeat] = useState<boolean>(false);
  const [bpm, setBpm] = useState<number>(120);
  const [beatDiv, setBeatDiv] = useState<number>(1); // 1 = quarter, 0.5 = eighth, 0.25 = sixteenth
  const [quantizeMode, setQuantizeMode] = useState<'nearest' | 'ceil' | 'floor'>('nearest');
  // animation state for handles
  const animRef = useRef<{ target: number; value: number; raf?: number }[]>([]);
  // hit flash values per-note (0..1)
  const hitRef = useRef<number[]>([]);
  // previous playhead time for detecting crossings
  const prevPlayRef = useRef<number>(0);
  // resolved audio element (may point at shared player)
  const audioElemRef = useRef<HTMLAudioElement | null>(null);
  // refs for mouse handlers to avoid stale closures in window-level listeners
  const onMouseMoveRef = useRef<(e: React.MouseEvent) => void>(() => {});
  const onMouseUpRef = useRef<() => void>(() => {});

  const pushUndo = (snap: Note[]) => {
    try {
      const copy = JSON.parse(JSON.stringify(snap)) as Note[];
      undoStack.current.push(copy);
      // limit history
      if (undoStack.current.length > 200) undoStack.current.shift();
      // clear redo on new action
      redoStack.current = [];
    } catch (e) {
      log.warn('pushUndo failed', e);
    }
  };

  const setNotesWithHistory = (updater: Note[] | ((prev: Note[]) => Note[])) => {
    setNotes(prev => {
      pushUndo(prev);
      const next = typeof updater === 'function' ? (updater as (prev: Note[]) => Note[])(prev) : updater;
      return next;
    });
  };

  const undo = () => {
    if (undoStack.current.length === 0) return;
    const last = undoStack.current.pop()!;
    // push current to redo
    try { redoStack.current.push(JSON.parse(JSON.stringify(notes))); } catch (_e) { /* Best-effort — no action needed on failure */ }
    setNotes(last);
    setUltrastarText(notesToUltrastar(last, ultrastarText));
    setSelectedIndex(null);
    showToast(t('notesTab.undone'));
  };

  const redo = () => {
    if (redoStack.current.length === 0) return;
    const nextSnap = redoStack.current.pop()!;
    try { undoStack.current.push(JSON.parse(JSON.stringify(notes))); } catch (_e) { /* Best-effort — no action needed on failure */ }
    setNotes(nextSnap);
    setUltrastarText(notesToUltrastar(nextSnap, ultrastarText));
    setSelectedIndex(null);
    showToast(t('notesTab.redone'));
  };

  const saveProject = () => {
    const payload = {
      notes,
      ultrastarText,
      audioUrl,
      savedAt: new Date().toISOString()
    };
    try {
      localStorage.setItem('audioverse-editor-backup', JSON.stringify(payload));
    } catch (e) {
      log.warn('localStorage save failed', e);
    }
    // trigger download
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audioverse-editor-backup-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast(t('notesTab.saved'));
  };

  useImperativeHandle(ref, () => ({
    undo,
    redo,
    save: saveProject,
  }));

  // toasts handled by centralized ToastProvider via useToast()

  useEffect(() => {
    const parsed = parseUltrastarToNotes(ultrastarText);
    setNotes(parsed);
    const maxEnd = parsed.reduce((m, n) => Math.max(m, n.start + n.duration), 0);
    setDuration(Math.max(30, Math.ceil(maxEnd)));
  }, [ultrastarText]);

  // initialize animation refs for notes
  useEffect(() => {
    animRef.current = notes.map(() => ({ target: 0, value: 0 }));
    hitRef.current = notes.map(() => 0);
  }, [notes.length]);

  // animation loop for hover/active easing and hit decay
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      let dirty = false;
      for (let i = 0; i < animRef.current.length; i++) {
        const a = animRef.current[i];
        const diff = a.target - a.value;
        if (Math.abs(diff) > 0.01) {
          a.value += diff * 0.25;
          dirty = true;
        } else {
          a.value = a.target;
        }
        // decay hit flash
        if (hitRef.current[i] && hitRef.current[i] > 0) {
          hitRef.current[i] = Math.max(0, hitRef.current[i] - 0.03);
          dirty = true;
        }
        // gently release anim target back to 0 over time
        if (a.target > 0) {
          a.target = Math.max(0, a.target - 0.02);
          dirty = true;
        }
      }
      if (dirty) draw();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // Mount-only effect — deps intentionally empty: continuous RAF animation loop for easing/decay
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const audioEl = (audioRef && 'current' in audioRef && audioRef.current) ?? (document.querySelector('audio') as HTMLAudioElement | null);
      if (audioEl instanceof HTMLAudioElement) {
        audioElemRef.current = audioEl;
        setPlayhead(audioEl.currentTime || 0);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [audioUrl, audioRef]);

  // detect crossings of note start times to trigger hit flashes
  useEffect(() => {
    const prev = prevPlayRef.current || 0;
    for (let i = 0; i < notes.length; i++) {
      const n = notes[i];
      if (prev < n.start && (playhead || 0) >= n.start) {
        hitRef.current[i] = 1;
        if (animRef.current[i]) animRef.current[i].target = 1;
      }
    }
    prevPlayRef.current = playhead || 0;
  }, [playhead, notes]);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, rect.width, rect.height);
    // background
    ctx.fillStyle = 'var(--bg-primary, #0b1220)';
    ctx.fillRect(0, 0, rect.width, rect.height);
    // grid: time ticks
    ctx.strokeStyle = 'var(--grid-line, rgba(255,255,255,0.06))';
    for (let t = 0; t <= duration; t += Math.max(1, Math.round(duration / 10))) {
      const x = (t / duration) * rect.width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, rect.height);
      ctx.stroke();
    }
    // draw notes with handles
    for (let idx = 0; idx < notes.length; idx++) {
      const n = notes[idx];
      const x = (n.start / duration) * rect.width;
      const w = (n.duration / duration) * rect.width;
      const pitchNorm = (n.pitch - 48) / (84 - 48); // map 48..84 to 0..1
      const y = rect.height - Math.max(6, pitchNorm * rect.height);
      const h = 10;
      // main note
      ctx.fillStyle = 'var(--accent-primary, #2ec4b6)';
      ctx.fillRect(x, y - h/2, Math.max(2, w), h);
      ctx.strokeStyle = 'var(--note-stroke, rgba(0,0,0,0.3))';
      ctx.strokeRect(x, y - h/2, Math.max(2, w), h);
      // hit flash overlay (use playerColor if provided)
      const hv = hitRef.current[idx] || 0;
      if (hv > 0.001) {
        const base = playerColor || 'var(--btn-text, #ffffff)';
        const resolved = resolveCssColor(base);
        const [r, g, b] = parseColorToRgb(resolved);
        ctx.fillStyle = `rgba(${r},${g},${b},${0.28 * hv})`;
        ctx.fillRect(x, y - h/2, Math.max(2, w), h);
        // outline pulse
        ctx.strokeStyle = `rgba(${r},${g},${b},${0.6 * hv})`;
        ctx.lineWidth = Math.max(1, 2 * hv);
        ctx.strokeRect(x - 1, y - h/2 - 1, Math.max(2, w) + 2, h + 2);
        ctx.lineWidth = 1;
      }

      // draw lyric/syllable above note
      if (n.lyric) {
        ctx.font = '12px system-ui, Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
          ctx.fillStyle = 'var(--btn-text, #ffffff)';
        const tx = x + Math.max(2, w) / 2;
        const ty = y - h/2 - 6;
        // shadow for readability
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillText(n.lyric, tx + 1, ty + 1);
        ctx.fillStyle = 'var(--btn-text, #ffffff)';
        ctx.fillText(n.lyric, tx, ty);
      }

      // draw small drag knob in center (animated)
      const cx = x + Math.max(2, w) / 2;
      const cy = y;
      ctx.beginPath();
      const knobActive = selectedIndex === idx && dragState.current?.mode === 'move';
      const knobHover = hover?.idx === idx && hover.part === 'body';
      const baseKnob = 3;
      const anim = animRef.current[idx] ? animRef.current[idx].value : 0;
      const knobSize = baseKnob + anim * 3 + (knobActive ? 1.5 : 0);
      ctx.fillStyle = knobActive ? 'var(--accent, #ff8800)' : knobHover ? 'var(--accent-light, #ffd27f)' : (selectedIndex === idx ? 'var(--gold-light, #ffdd57)' : 'var(--btn-text, #ffffff)');
      ctx.arc(cx, cy, knobSize, 0, Math.PI * 2);
      ctx.fill();

      // draw resize handles (left and right)
      const handleSize = 8;
      const handleY = y - handleSize / 2;
      const leftActive = selectedIndex === idx && dragState.current?.side === 'left';
      const rightActive = selectedIndex === idx && dragState.current?.side === 'right';
      const leftHover = hover?.idx === idx && hover.part === 'edge-left';
      const rightHover = hover?.idx === idx && hover.part === 'edge-right';
      // left handle
      const leftAnim = animRef.current[idx] ? animRef.current[idx].value : 0;
      const rightAnim = animRef.current[idx] ? animRef.current[idx].value : 0;
      const leftSize = handleSize + (leftActive || leftHover ? leftAnim * 6 : 0);
      const rightSize = handleSize + (rightActive || rightHover ? rightAnim * 6 : 0);
      ctx.fillStyle = leftActive ? 'var(--accent, #ff8800)' : leftHover ? 'var(--accent-light, #ffd27f)' : (selectedIndex === idx ? 'var(--gold-light, #ffdd57)' : 'var(--btn-text, #ffffff)');
      ctx.fillRect(x - leftSize / 2, handleY - (leftSize - handleSize) / 2, leftSize, leftSize);
      // right handle
      ctx.fillStyle = rightActive ? 'var(--accent, #ff8800)' : rightHover ? 'var(--accent-light, #ffd27f)' : (selectedIndex === idx ? 'var(--gold-light, #ffdd57)' : 'var(--btn-text, #ffffff)');
      ctx.fillRect(x + Math.max(2, w) - rightSize / 2, handleY - (rightSize - handleSize) / 2, rightSize, rightSize);
      // dark border for handles
      ctx.strokeStyle = 'var(--handle-border, rgba(0,0,0,0.4))';
      ctx.strokeRect(x - leftSize / 2, handleY - (leftSize - handleSize) / 2, leftSize, leftSize);
      ctx.strokeRect(x + Math.max(2, w) - rightSize / 2, handleY - (rightSize - handleSize) / 2, rightSize, rightSize);
    }
    // draw selected highlight
    if (selectedIndex !== null && notes[selectedIndex]) {
      const n = notes[selectedIndex];
      const x = (n.start / duration) * rect.width;
      const w = (n.duration / duration) * rect.width;
      const pitchNorm = (n.pitch - 48) / (84 - 48);
      const y = rect.height - Math.max(6, pitchNorm * rect.height);
      ctx.strokeStyle = 'var(--gold-light, #ffdd57)';
      ctx.lineWidth = 2;
      ctx.strokeRect(x - 1, y - 6, Math.max(3, w + 2), 12);
      ctx.lineWidth = 1;
    }
    // draw playhead
    if (typeof playhead === 'number') {
      const px = Math.max(0, Math.min(rect.width, (playhead / duration) * rect.width));
      ctx.strokeStyle = 'var(--playhead, rgba(255,100,100,0.9))';
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, rect.height);
      ctx.stroke();
    }
  };

  useEffect(() => {
    draw();
  }, [notes, duration, playhead, selectedIndex, hover]);

  const getNoteRect = (n: Note, rect: DOMRect) => {
    const x = (n.start / duration) * rect.width;
    const w = (n.duration / duration) * rect.width;
    const pitchNorm = (n.pitch - 48) / (84 - 48);
    const y = rect.height - Math.max(6, pitchNorm * rect.height);
    const h = 10;
    return { x, y: y - h/2, w: Math.max(2, w), h };
  };

  const hitTest = (px: number, py: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { idx: -1, part: 'none' as const };
    const rect = canvas.getBoundingClientRect();
    for (let i = notes.length - 1; i >= 0; i--) {
      const n = notes[i];
      const r = getNoteRect(n, rect);
      // left edge region
      if (py >= r.y && py <= r.y + r.h && px >= r.x - 12 && px <= r.x + 12) return { idx: i, part: 'edge-left' as const };
      // right edge region
      if (py >= r.y && py <= r.y + r.h && px >= r.x + r.w - 12 && px <= r.x + r.w + 12) return { idx: i, part: 'edge-right' as const };
      if (py >= r.y && py <= r.y + r.h && px >= r.x - 2 && px <= r.x + r.w + 2) return { idx: i, part: 'body' as const };
    }
    return { idx: -1, part: 'none' as const };
  };

  const getSnapInterval = () => {
    if (snapToBeat) {
      if (!bpm || bpm <= 0) return 60 / 120 * beatDiv;
      return (60 / bpm) * beatDiv;
    }
    return snapValue;
  };

  const quantize = (value: number, interval: number, mode: 'nearest' | 'ceil' | 'floor') => {
    if (!interval || interval <= 0) return value;
    const v = value / interval;
    let q = v;
    if (mode === 'nearest') q = Math.round(v);
    else if (mode === 'floor') q = Math.floor(v);
    else q = Math.ceil(v);
    return Math.max(0, q * interval);
  };

  const onMouseDown = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const hit = hitTest(x, y);
    if (hit.idx >= 0) {
      const n = notes[hit.idx];
      // start drag: record history snapshot
      pushUndo(notes);
      if (hit.part === 'edge-right') {
        dragState.current = { mode: 'resize', side: 'right', startX: x, origNote: { ...n } };
      } else if (hit.part === 'edge-left') {
        dragState.current = { mode: 'resize', side: 'left', startX: x, origNote: { ...n } };
      } else {
        dragState.current = { mode: 'move', startX: x, origNote: { ...n } };
      }
      setSelectedIndex(hit.idx);
      // set anim target for this note to active
      if (animRef.current[hit.idx]) animRef.current[hit.idx].target = 1;
      return;
    }
    // not clicked on note -> add new note
    const time = (x / rect.width) * duration;
    const pitch = Math.round(((rect.height - y) / rect.height) * (84 - 48) + 48);
    const newNote: Note = { start: Math.max(0, time), duration: 0.5, pitch };
    setNotesWithHistory(prev => {
      const toAdd = { ...newNote };
      if (snapEnabled) {
        const interval = getSnapInterval();
        toAdd.start = quantize(toAdd.start, interval, quantizeMode);
      }
      const next = [...prev, toAdd].sort((a,b) => a.start - b.start);
      // export immediately and select the new note
      setUltrastarText(notesToUltrastar(next, ultrastarTextRef.current));
      const newIndex = next.findIndex(n => n === toAdd);
      setTimeout(() => setSelectedIndex(newIndex >= 0 ? newIndex : null), 0);
      return next;
    });
  };

  const onMouseMove = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ds = dragState.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (!ds || ds.mode === 'none') {
      // hover cursor
      const hit = hitTest(x, y);
      setHover(hit.idx >= 0 ? { idx: hit.idx, part: hit.part } : null);
      if (hit.part === 'edge-left' || hit.part === 'edge-right') canvas.style.cursor = 'ew-resize';
      else if (hit.part === 'body') canvas.style.cursor = 'grab';
      else canvas.style.cursor = 'crosshair';
      return;
    }
    const dx = x - (ds.startX || 0);
    if (selectedIndex === null) return;
    setNotes(prev => {
      const next = prev.map((n, idx) => idx === selectedIndex ? { ...n } : n);
      const n = next[selectedIndex];
      if (!n) return prev;
      const pxPerSec = rect.width / duration;
      if (ds.mode === 'move') {
        const deltaSec = dx / pxPerSec;
        let ns = Math.max(0, (ds.origNote!.start || 0) + deltaSec);
        if (snapEnabled) {
          const interval = getSnapInterval();
          ns = quantize(ns, interval, quantizeMode);
        }
        n.start = ns;
      } else if (ds.mode === 'resize') {
        const deltaSec = dx / pxPerSec;
        if (ds.side === 'right') {
          let nd = Math.max(0.05, (ds.origNote!.duration || 0) + deltaSec);
          if (snapEnabled) {
            const interval = getSnapInterval();
            nd = Math.max(0.05, quantize(nd, interval, quantizeMode));
          }
          n.duration = nd;
        } else {
          // left resize: move start, keep end fixed
          const origStart = ds.origNote!.start || 0;
          const origDur = ds.origNote!.duration || 0;
          const end = origStart + origDur;
          let newStart = Math.max(0, origStart + deltaSec);
          if (snapEnabled) {
            const interval = getSnapInterval();
            newStart = quantize(newStart, interval, quantizeMode);
          }
          const newDur = Math.max(0.05, end - newStart);
          n.start = newStart;
          n.duration = newDur;
        }
      }
      next[selectedIndex] = n;
      return [...next].sort((a,b) => a.start - b.start);
    });
  };

  const onMouseUp = () => {
    if (dragState.current && dragState.current.mode !== 'none') {
      dragState.current = { mode: 'none', startX: 0 };
      // export updated notes
      const txt = notesToUltrastar(notes, ultrastarTextRef.current);
      setUltrastarText(txt);
      // clear redo stack on finish
      redoStack.current = [];
    }
    const canvas = canvasRef.current;
    if (canvas) canvas.style.cursor = 'crosshair';
  };

  const onDoubleClick = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const hit = hitTest(x, y);
    const time = (x / rect.width) * duration;
    if (hit.idx >= 0 && hit.part === 'body') {
      // split note at click time
      setNotesWithHistory(prev => {
        const n = prev[hit.idx];
        if (!n) return prev;
        if (time <= n.start || time >= n.start + n.duration) return prev;
        const left: Note = { start: n.start, duration: time - n.start, pitch: n.pitch };
        const right: Note = { start: time, duration: n.start + n.duration - time, pitch: n.pitch };
        const next = [...prev.slice(0, hit.idx), left, right, ...prev.slice(hit.idx + 1)].sort((a,b) => a.start - b.start);
        setUltrastarText(notesToUltrastar(next, ultrastarTextRef.current));
        return next;
      });
    }
  };

  // keep handler refs up-to-date for window-level listeners
  onMouseMoveRef.current = onMouseMove;
  onMouseUpRef.current = onMouseUp;

  // ensure mouseup outside canvas also stops dragging
  useEffect(() => {
    const onUp = () => onMouseUpRef.current();
    const onMove = (ev: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      // call onMouseMove with a synthetic event
      const synthetic = { clientX: ev.clientX, clientY: ev.clientY } as unknown as React.MouseEvent;
      onMouseMoveRef.current(synthetic);
    };
    window.addEventListener('mouseup', onUp);
    window.addEventListener('mousemove', onMove);
    return () => {
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('mousemove', onMove);
    };
  }, []); // stable — uses refs

  const exportToUltrastar = () => {
    const txt = notesToUltrastar(notes, ultrastarTextRef.current);
    setUltrastarText(txt);
  };

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      // Undo / Redo shortcuts: Ctrl/Cmd+Z (Shift for redo), Ctrl/Cmd+Y
      if ((ev.ctrlKey || ev.metaKey) && (ev.key === 'z' || ev.key === 'Z')) {
        ev.preventDefault();
        if (ev.shiftKey) redo(); else undo();
        return;
      }
      if ((ev.ctrlKey || ev.metaKey) && (ev.key === 'y' || ev.key === 'Y')) {
        ev.preventDefault();
        redo();
        return;
      }
      if (ev.key === 'Delete' && selectedIndex !== null) {
        setNotesWithHistory(prev => {
          const next = prev.filter((_, i) => i !== selectedIndex);
          setSelectedIndex(null);
          const txt = notesToUltrastar(next, ultrastarTextRef.current);
          setUltrastarText(txt);
          return next;
        });
        return;
      }
      // nudge selected note by snap interval
      if ((ev.key === 'ArrowLeft' || ev.key === 'ArrowRight') && selectedIndex !== null) {
        const dir = ev.key === 'ArrowRight' ? 1 : -1;
        const interval = getSnapInterval();
        setNotesWithHistory(prev => {
          const next = prev.map((n, i) => i === selectedIndex ? { ...n } : n);
          const nn = next[selectedIndex];
          if (!nn) return prev;
          nn.start = Math.max(0, nn.start + dir * interval * 0.5);
          return [...next].sort((a,b) => a.start - b.start);
        });
        setNotes(prev => {
          setUltrastarText(notesToUltrastar(prev, ultrastarTextRef.current));
          return prev;
        });
        return;
      }
      // change duration with + / -
      if ((ev.key === '+' || ev.key === '=' || ev.key === '-') && selectedIndex !== null) {
        const grow = ev.key !== '-';
        const interval = getSnapInterval();
        setNotesWithHistory(prev => {
          const next = prev.map((n, i) => i === selectedIndex ? { ...n } : n);
          const nn = next[selectedIndex];
          if (!nn) return prev;
          nn.duration = Math.max(0.05, nn.duration + (grow ? 1 : -1) * interval * 0.5);
          return [...next].sort((a,b) => a.start - b.start);
        });
        setNotes(prev => {
          setUltrastarText(notesToUltrastar(prev, ultrastarTextRef.current));
          return prev;
        });
        return;
      }
      // split selected note at playhead
      if (ev.key === 'Enter' && selectedIndex !== null) {
        const idx = selectedIndex;
        const ph = playhead;
        setNotesWithHistory(prev => {
          const n = prev[idx];
          if (!n) return prev;
          if (ph <= n.start || ph >= n.start + n.duration) return prev;
          const left: Note = { start: n.start, duration: ph - n.start, pitch: n.pitch };
          const right: Note = { start: ph, duration: n.start + n.duration - ph, pitch: n.pitch };
          const next = [...prev.slice(0, idx), left, right, ...prev.slice(idx+1)].sort((a,b) => a.start - b.start);
          setUltrastarText(notesToUltrastar(next, ultrastarTextRef.current));
          return next;
        });
        return;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedIndex, setUltrastarText, playhead, snapEnabled, bpm, beatDiv, quantizeMode, snapValue, notes]);

  // update hover target and animation targets
  useEffect(() => {
    for (let i = 0; i < animRef.current.length; i++) {
      const a = animRef.current[i];
      if (hover && hover.idx === i) a.target = 1;
      else if (selectedIndex === i) a.target = 1;
      else a.target = 0;
    }
  }, [hover, selectedIndex]);

  return (
    <div>
      <div style={{ marginBottom: 8 }}>
        <b>{t('notesTab.timelinePianoRoll')}</b>
      </div>
      <div style={{ marginBottom: 8 }}>
        <div>{t('notesTab.audioStatus', { status: audioUrl ? t('notesTab.audioSelected') : t('notesTab.audioNone'), duration })}</div>
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input type="checkbox" checked={snapEnabled} onChange={e => setSnapEnabled(e.target.checked)} />
          <span>{t('notesTab.snap')}</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input type="checkbox" checked={snapToBeat} onChange={e => setSnapToBeat(e.target.checked)} />
          <span>{t('notesTab.snapToBeat')}</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>{t('notesTab.bpm')}</span>
          <input type="number" value={bpm} onChange={e => setBpm(Math.max(20, Math.min(300, parseFloat(e.target.value || '120'))))} style={{ width: 72 }} />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>{t('notesTab.beatDiv')}</span>
          <select value={String(beatDiv)} onChange={e => setBeatDiv(parseFloat(e.target.value))} aria-label={t('notesTab.beatDiv')}>
            <option value="1">{t('notesTab.beatQuarter')}</option>
            <option value="0.5">{t('notesTab.beatEighth')}</option>
            <option value="0.25">{t('notesTab.beatSixteenth')}</option>
            <option value="0.125">{t('notesTab.beatThirtySecond')}</option>
          </select>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>{t('notesTab.quantizeLabel')}</span>
          <select value={quantizeMode} onChange={e => setQuantizeMode(e.target.value as 'nearest' | 'ceil' | 'floor')} aria-label={t('notesTab.quantizeLabel')}>
            <option value="nearest">{t('notesTab.nearest')}</option>
            <option value="floor">{t('notesTab.floor')}</option>
            <option value="ceil">{t('notesTab.ceil')}</option>
          </select>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>{t('notesTab.grid')}</span>
          <select value={String(snapValue)} onChange={e => setSnapValue(parseFloat(e.target.value))} aria-label={t('notesTab.grid')}>
            <option value="0.125">1/8s</option>
            <option value="0.25">1/4s</option>
            <option value="0.5">1/2s</option>
            <option value="1">1s</option>
          </select>
        </label>
        <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-secondary, #888)' }}>
          {t('notesTab.snapStatus', { status: snapEnabled ? t('notesTab.on') : t('notesTab.off'), detail: snapToBeat ? t('notesTab.beatDetail', { bpm }) : t('notesTab.gridDetail', { value: snapValue }), mode: quantizeMode })}
        </div>
      </div>

      <div style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: 6, overflow: 'hidden' }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: 160, display: 'block', cursor: 'crosshair' }} onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onDoubleClick={onDoubleClick}  role="img" aria-label="Notes Tab canvas"/>
      </div>

      <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
        <button onClick={undo} disabled={undoStack.current.length === 0}>{t('notesTab.undo')}</button>
        <button onClick={redo} disabled={redoStack.current.length === 0}>{t('notesTab.redo')}</button>
        <button onClick={exportToUltrastar}>{t('notesTab.exportToUltrastar')}</button>
        <button onClick={() => { pushUndo(notes); setNotes([]); setUltrastarText(notesToUltrastar([], ultrastarTextRef.current)); }} style={{ marginLeft: 8 }}>{t('notesTab.clear')}</button>
        <button onClick={saveProject} style={{ marginLeft: 'auto' }}>{t('notesTab.save')}</button>
      </div>

      <div style={{ marginTop: 12 }}>
        <b>{t('notesTab.notesCount', { count: notes.length })}</b>
        <ul>
          {notes.map((n, i) => (
            <li key={i}>{t('notesTab.noteItem', { start: n.start.toFixed(2), duration: n.duration.toFixed(2), pitch: n.pitch })}</li>
          ))}
        </ul>
      </div>
    </div>
  );
});

export default NotesTab;
