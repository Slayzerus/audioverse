export interface InstrumentPreset {
  name: string;
  waveform: OscillatorType;
  attack: number;
  sustain: number;
  release: number;
  eq: { [key: string]: number };
category: "Keyboard" | "String" | "Percussion" | "Bass" | "Brass" | "Woodwind" | "Synth";
}

export const instrumentPresets: InstrumentPreset[] = [
// 🎹 Keyboard Instruments
{
name: "Grand Piano",
waveform: "sawtooth",
attack: 0.02,
sustain: 0.7,
release: 1.2,
eq: { C: 2, D: 1, E: 1, F: 0, G: 0, A: -1, B: -2, C2: -3 },
category: "Keyboard"
},
{
name: "Electric Piano",
waveform: "triangle",
attack: 0.03,
sustain: 0.8,
release: 1.0,
eq: { C: 0, D: 1, E: 2, F: 3, G: 1, A: -1, B: -2, C2: -2 },
category: "Keyboard"
},
{
name: "Harpsichord",
waveform: "square",
attack: 0.01,
sustain: 0.5,
release: 0.6,
eq: { C: -1, D: -1, E: 0, F: 2, G: 3, A: 1, B: 0, C2: -1 },
category: "Keyboard"
},

// 🎻 String Instruments
{
name: "Violin",
waveform: "triangle",
attack: 0.3,
sustain: 1.0,
release: 1.5,
eq: { C: 3, D: 2, E: 2, F: 1, G: -1, A: -2, B: -3, C2: -3 },
category: "String"
},
{
name: "Acoustic Guitar",
waveform: "sawtooth",
attack: 0.2,
sustain: 0.6,
release: 0.9,
eq: { C: -1, D: -2, E: 0, F: 1, G: 3, A: 2, B: 0, C2: -2 },
category: "String"
},
{
name: "Electric Guitar",
waveform: "square",
attack: 0.05,
sustain: 0.7,
release: 1.2,
eq: { C: -2, D: 1, E: 2, F: 2, G: 1, A: 0, B: -1, C2: -3 },
category: "String"
},

// 🥁 Percussion Instruments
{
name: "Kick Drum",
waveform: "sine",
attack: 0.005,
sustain: 0.1,
release: 0.2,
eq: { C: 5, D: 3, E: 0, F: -3, G: -5, A: -7, B: -9, C2: -10 },
category: "Percussion"
},
{
name: "Snare Drum",
waveform: "triangle",
attack: 0.01,
sustain: 0.2,
release: 0.3,
eq: { C: -2, D: -1, E: 1, F: 2, G: 3, A: 2, B: 0, C2: -2 },
category: "Percussion"
},
{
name: "Hi-Hat",
waveform: "square",
attack: 0.002,
sustain: 0.05,
release: 0.1,
eq: { C: -5, D: -3, E: 0, F: 2, G: 5, A: 7, B: 9, C2: 10 },
category: "Percussion"
},

// 🎸 Bass Instruments
{
name: "Acoustic Bass",
waveform: "sine",
attack: 0.08,
sustain: 0.8,
release: 1.2,
eq: { C: 4, D: 3, E: 2, F: 1, G: 0, A: -1, B: -2, C2: -3 },
category: "Bass"
},
{
name: "Electric Bass",
waveform: "square",
attack: 0.05,
sustain: 0.9,
release: 1.3,
eq: { C: 3, D: 2, E: 1, F: 0, G: -1, A: -2, B: -3, C2: -4 },
category: "Bass"
},

// 🎺 Brass Instruments
{
name: "Trumpet",
waveform: "sawtooth",
attack: 0.1,
sustain: 0.9,
release: 1.5,
eq: { C: 2, D: 3, E: 4, F: 5, G: 3, A: 1, B: -1, C2: -3 },
category: "Brass"
},
{
name: "Trombone",
waveform: "triangle",
attack: 0.2,
sustain: 1.0,
release: 1.7,
eq: { C: 3, D: 4, E: 5, F: 4, G: 2, A: 0, B: -2, C2: -4 },
category: "Brass"
},

// 🎷 Woodwind Instruments
{
name: "Saxophone",
waveform: "sawtooth",
attack: 0.15,
sustain: 0.8,
release: 1.3,
eq: { C: 2, D: 3, E: 4, F: 3, G: 1, A: -1, B: -2, C2: -3 },
category: "Woodwind"
},
{
name: "Clarinet",
waveform: "triangle",
attack: 0.18,
sustain: 0.9,
release: 1.6,
eq: { C: 3, D: 4, E: 5, F: 4, G: 2, A: 0, B: -1, C2: -2 },
category: "Woodwind"
},

// 🎛 Synth Instruments
{
name: "Saw Synth",
waveform: "sawtooth",
attack: 0.05,
sustain: 0.9,
release: 1.2,
eq: { C: 2, D: 3, E: 4, F: 3, G: 2, A: 0, B: -1, C2: -2 },
category: "Synth"
},
{
name: "Square Lead",
waveform: "square",
attack: 0.04,
sustain: 0.85,
release: 1.1,
eq: { C: 2, D: 3, E: 4, F: 3, G: 1, A: 0, B: -1, C2: -3 },
category: "Synth"
}
];
