import React from "react";
import AudioEditorPianoRoll from "./AudioEditorPianoRoll";
import type { MidiNote } from "../../../models/editor/midiTypes";
import type { CCLaneEvent } from "./CCLane";

interface AudioEditorPianoRollContainerProps {
  notes: MidiNote[];
  onAddNote: (pitch: number, start: number, duration: number) => void;
  onRemoveNote: (noteId: number) => void;
  selectedNoteId?: number | null;
  setSelectedNoteId?: (id: number | null) => void;
  duration?: number;
  zoom?: number;
  ccEvents?: CCLaneEvent[];
  onAddCCEvent?: (cc: number, value: number, time: number) => void;
  onUpdateCCEvent?: (id: number, value: number, time: number, handleType?: 'linear' | 'step' | 'exp') => void;
  onRemoveCCEvent?: (id: number) => void;
  ccType?: number;
}

const AudioEditorPianoRollContainer: React.FC<AudioEditorPianoRollContainerProps> = (props) => {
  return <AudioEditorPianoRoll {...props} />;
};

export default AudioEditorPianoRollContainer;
