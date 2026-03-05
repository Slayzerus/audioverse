// MIDI utility functions extracted from AudioEditor
import { MidiNote, MidiCCEvent } from '../models/editor/midiTypes';

export function addMidiNote(
  _layerMidiNotes: Record<number, MidiNote[]>,
  setLayerMidiNotes: React.Dispatch<React.SetStateAction<Record<number, MidiNote[]>>>,
  setSelectedMidiNote: React.Dispatch<React.SetStateAction<{ layerId: number; noteId: number } | null>>,
  layerId: number,
  pitch: number,
  start: number,
  durationSec: number = 0.5,
  velocity: number = 100
) {
  const newNote: MidiNote = {
    id: Date.now() + Math.floor(Math.random() * 1000),
    pitch,
    start,
    duration: durationSec,
    velocity,
  };
  setLayerMidiNotes((prev) => ({
    ...prev,
    [layerId]: [...(prev[layerId] || []), newNote],
  }));
  setSelectedMidiNote({ layerId, noteId: newNote.id });
}

export function removeMidiNote(
  setLayerMidiNotes: React.Dispatch<React.SetStateAction<Record<number, MidiNote[]>>>,
  setSelectedMidiNote: React.Dispatch<React.SetStateAction<{ layerId: number; noteId: number } | null>>,
  layerId: number,
  noteId: number
) {
  setLayerMidiNotes((prev) => ({
    ...prev,
    [layerId]: (prev[layerId] || []).filter((n) => n.id !== noteId),
  }));
  setSelectedMidiNote(null);
}

export function clearMidiNotes(
  setLayerMidiNotes: React.Dispatch<React.SetStateAction<Record<number, MidiNote[]>>>,
  setSelectedMidiNote: React.Dispatch<React.SetStateAction<{ layerId: number; noteId: number } | null>>,
  layerId: number
) {
  setLayerMidiNotes((prev) => ({
    ...prev,
    [layerId]: [],
  }));
  setSelectedMidiNote(null);
}

export function handleSelectCCLane(
  setLayerCCType: React.Dispatch<React.SetStateAction<Record<number, number>>>,
  layerId: number,
  cc: number
) {
  setLayerCCType((prev) => ({ ...prev, [layerId]: cc }));
}

export function handleAddCCEvent(
  setLayerMidiCC: React.Dispatch<React.SetStateAction<Record<number, MidiCCEvent[]>>>,
  layerId: number,
  cc: number,
  value: number,
  time: number
) {
  const newEvent: MidiCCEvent = {
    id: Date.now() + Math.floor(Math.random() * 1000),
    cc,
    value,
    time,
  };
  setLayerMidiCC((prev) => ({
    ...prev,
    [layerId]: [...(prev[layerId] || []), newEvent],
  }));
}

export function handleUpdateCCEvent(
  setLayerMidiCC: React.Dispatch<React.SetStateAction<Record<number, MidiCCEvent[]>>>,
  layerId: number,
  id: number,
  value: number,
  time: number,
  handleType?: 'linear' | 'step' | 'exp'
) {
  setLayerMidiCC((prev) => ({
    ...prev,
    [layerId]: (prev[layerId] || []).map(ev => ev.id === id ? { ...ev, value, time, handleType: handleType ?? ev.handleType } : ev),
  }));
}

export function handleRemoveCCEvent(
  setLayerMidiCC: React.Dispatch<React.SetStateAction<Record<number, MidiCCEvent[]>>>,
  layerId: number,
  id: number
) {
  setLayerMidiCC((prev) => ({
    ...prev,
    [layerId]: (prev[layerId] || []).filter(ev => ev.id !== id),
  }));
}
