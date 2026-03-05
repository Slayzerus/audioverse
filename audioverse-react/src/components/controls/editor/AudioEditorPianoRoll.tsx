import React from "react";

import { PianoRoll } from "./PianoRoll";
import CCLane, { CCLaneEvent } from "./CCLane";
import type { MidiNote } from "../../../models/editor/midiTypes";

interface AudioEditorPianoRollProps {
  notes: MidiNote[];
  onAddNote: (pitch: number, start: number, duration: number) => void;
  onRemoveNote: (noteId: number) => void;
  selectedNoteId?: number | null;
  setSelectedNoteId?: (id: number | null) => void;
  duration?: number;
  zoom?: number;
  // CC lane props
  ccEvents?: CCLaneEvent[];
  onAddCCEvent?: (cc: number, value: number, time: number) => void;
  onUpdateCCEvent?: (id: number, value: number, time: number, handleType?: 'linear' | 'step' | 'exp') => void;
  onRemoveCCEvent?: (id: number) => void;
  ccType?: number; // e.g. 1=mod wheel
}


const AudioEditorPianoRoll: React.FC<AudioEditorPianoRollProps> = (props) => {
  const {
    ccEvents = [],
    onAddCCEvent,
    onUpdateCCEvent,
    onRemoveCCEvent,
    ccType = 1,
    duration = 4,
    zoom = 1,
    ...pianoRollProps
  } = props;
  const width = 320 * zoom;
  return (
    <div className="audio-editor-pianoroll" style={{ margin: "16px 0" }}>
      <h6 style={{ fontSize: 14, marginBottom: 8 }}>🎹 Piano Roll (MIDI Editor)</h6>
      <PianoRoll {...pianoRollProps} duration={duration} zoom={zoom} />
      <div style={{ marginTop: 8 }}>
        <CCLane
          ccEvents={ccEvents}
          onAddEvent={onAddCCEvent || (() => {})}
          onUpdateEvent={onUpdateCCEvent || (() => {})}
          onRemoveEvent={onRemoveCCEvent || (() => {})}
          ccType={ccType}
          duration={duration}
          width={width}
        />
      </div>
    </div>
  );
};

export default AudioEditorPianoRoll;