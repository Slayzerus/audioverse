// Typy i interfejsy MIDI, CC, nuty

export interface MidiNote {
  id: number;
  pitch: number;
  start: number;
  duration: number;
  velocity: number;
}

export interface MidiCCEvent {
  id: number;
  cc: number;
  value: number;
  time: number;
  handleType?: 'linear' | 'step' | 'exp';
}
