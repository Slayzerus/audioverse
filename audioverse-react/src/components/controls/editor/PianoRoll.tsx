import React, { useRef, useEffect } from 'react';
import type { MidiNote } from '../../../models/editor/midiTypes';

interface PianoRollProps {
  notes: MidiNote[];
  onAddNote: (pitch: number, start: number, duration: number) => void;
  onRemoveNote: (noteId: number) => void;
  selectedNoteId?: number | null;
  setSelectedNoteId?: (id: number | null) => void;
  duration?: number;
  zoom?: number;
}

const PIANO_KEYS = 88; // C0 (21) to C8 (108)
const KEY_HEIGHT = 16;
const GRID_DIVS = 16; // 16th notes per bar
const BAR_WIDTH = 320;

function midiToKey(midi: number) {
  return midi - 21;
}

function keyToMidi(key: number) {
  return key + 21;
}

export const PianoRoll: React.FC<PianoRollProps> = ({
  notes,
  onAddNote,
  onRemoveNote,
  selectedNoteId,
  setSelectedNoteId,
  duration = 4,
  zoom = 1,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const width = BAR_WIDTH * zoom;
  const height = PIANO_KEYS * KEY_HEIGHT;

  // Mouse state for drawing notes
  const mouseState = useRef<{ drawing: boolean; startX: number; key: number } | null>(null);

  // Draw grid and notes
  useEffect(() => {
    // ...existing code for future canvas rendering...
  }, [notes, zoom, duration]);

  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = (e.target as SVGElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const key = Math.floor(y / KEY_HEIGHT);
    const pitch = keyToMidi(key);
    const start = (x / width) * duration;
    mouseState.current = { drawing: true, startX: x, key };
    // Start drawing note (length 0.25s default)
    onAddNote(pitch, start, duration / GRID_DIVS);
  };

  const handleNoteClick = (noteId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedNoteId?.(noteId);
  };

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      style={{ background: 'var(--surface-muted, #fafafa)', border: '1px solid var(--border, #bbb)', userSelect: 'none', display: 'block' }}
      onMouseDown={handleMouseDown}
    >
      {/* Draw horizontal keys */}
      {[...Array(PIANO_KEYS)].map((_, i) => (
        <rect
          key={i}
          x={0}
          y={i * KEY_HEIGHT}
          width={width}
          height={KEY_HEIGHT}
          fill={i % 2 === 0 ? 'var(--key-even, #f5f5f5)' : 'var(--key-odd, #e0e0e0)'}
        />
      ))}
      {/* Draw vertical grid lines */}
      {[...Array(GRID_DIVS + 1)].map((_, i) => (
        <line
          key={i}
          x1={(i * width) / GRID_DIVS}
          y1={0}
          x2={(i * width) / GRID_DIVS}
          y2={height}
          stroke="var(--border-muted, #ccc)"
          strokeWidth={i % 4 === 0 ? 2 : 1}
        />
      ))}
      {/* Draw notes */}
      {notes.map((note) => {
        const key = midiToKey(note.pitch);
        const x = (note.start / duration) * width;
        const w = (note.duration / duration) * width;
        return (
            <rect
            key={note.id}
            x={x}
            y={key * KEY_HEIGHT}
            width={Math.max(6, w)}
            height={KEY_HEIGHT - 2}
            fill={note.id === selectedNoteId ? 'var(--accent, #1976d2)' : 'var(--accent-light, #90caf9)'}
            stroke="var(--accent, #1976d2)"
            strokeWidth={note.id === selectedNoteId ? 2 : 1}
            rx={3}
            onClick={(e) => handleNoteClick(note.id, e)}
            onDoubleClick={() => onRemoveNote(note.id)}
            style={{ cursor: 'pointer' }}
          />
        );
      })}
    </svg>
  );
};
