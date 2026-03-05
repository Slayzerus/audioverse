// audioKeyboard.ts
let audioContext: AudioContext | null = null;
const eqSettings: { [key: string]: number } = {};

export const waveformTypes: { [key: string]: OscillatorType } = {
    "Pianino": "sawtooth",
    "Organy": "square",
    "Skrzypce": "triangle",
    "Gitara": "sawtooth",
    "Saksofon": "sine"
};

export const frequencies: { [key: string]: number } = {
    "C": 261.63, "C#": 277.18, "D": 293.66, "D#": 311.13, "E": 329.63,
    "F": 349.23, "F#": 369.99, "G": 392.00, "G#": 415.30, "A": 440.00, "A#": 466.16, "B": 493.88,
    "C2": 523.25
};

export const keyMappings: { [key: string]: { keyboard: string, gamepad?: string } } = {
    "C": { keyboard: "A", gamepad: "LT" },
    "C#": { keyboard: "W", gamepad: "LB" },
    "D": { keyboard: "S", gamepad: "X" },
    "D#": { keyboard: "E", gamepad: "RB" },
    "E": { keyboard: "D", gamepad: "RT" },
    "F": { keyboard: "F", gamepad: "Y" },
    "F#": { keyboard: "T", gamepad: "B" },
    "G": { keyboard: "G", gamepad: "A" },
    "G#": { keyboard: "Y", gamepad: "RIGHT" },
    "A": { keyboard: "H", gamepad: "LEFT" },
    "A#": { keyboard: "U", gamepad: "UP" },
    "B": { keyboard: "J", gamepad: "DOWN" },
    "C2": { keyboard: "K", gamepad: "START" }
};

export const keyboardLayout = [
    { note: "C", type: "white" }, { note: "C#", type: "black" },
    { note: "D", type: "white" }, { note: "D#", type: "black" },
    { note: "E", type: "white" },
    { note: "F", type: "white" }, { note: "F#", type: "black" },
    { note: "G", type: "white" }, { note: "G#", type: "black" },
    { note: "A", type: "white" }, { note: "A#", type: "black" },
    { note: "B", type: "white" }, { note: "C2", type: "white" }
];

export const instruments = ["Pianino", "Organy", "Skrzypce", "Gitara", "Saksofon"];

// Equalizer value update
export const updateEqualizer = (note: string, value: number) => {
    eqSettings[note] = value;
};

// Getting equalizer values for a given sound
export const getFrequencyGain = (note: string) => {
    return eqSettings[note] || 0;
};

export const startAudioContext = () => {
    if (!audioContext) {
        audioContext = new AudioContext();
        return true;
    }
    return false;
};

// Function for playing sounds with equalizer
export const playSynth = (
    note: string,
    instrument: string,
    setActiveKeys: React.Dispatch<React.SetStateAction<Set<string>>>,
    settings?: { sustain: number; volume: number; attack: number; release: number },
    eqGain: number = 1.0 // 🔥 Nowy parametr equalizera
): AudioBuffer | null => {
    if (!audioContext || !frequencies[note]) return null;

    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();

    // Getting waveform from preset or default "sine"
    const waveform = waveformTypes[instrument] || "sine";
    osc.type = waveform;

    // Setting frequency
    osc.frequency.setValueAtTime(frequencies[note], audioContext.currentTime);
    osc.connect(gain);
    gain.connect(audioContext.destination);

    // Getting settings or default values
    const attack = settings?.attack || 0.02;
    const sustain = settings?.sustain || 0.6;
    const release = settings?.release || 0.8;
    const volume = settings?.volume || 1.0;

    // 🔥 Considering the equalizer
    const adjustedGain = volume * eqGain;

    // Setting volume with equalizer
    gain.gain.setValueAtTime(0, audioContext.currentTime);
    gain.gain.linearRampToValueAtTime(adjustedGain, audioContext.currentTime + attack);
    gain.gain.linearRampToValueAtTime(adjustedGain * sustain, audioContext.currentTime + attack + 0.05);
    gain.gain.linearRampToValueAtTime(0, audioContext.currentTime + release);

    osc.start();
    setTimeout(() => osc.stop(), release * 1000);

    // Key highlight
    highlightKey(note, setActiveKeys);

    // 🔥 Creating AudioBuffer to return
    const buffer = audioContext.createBuffer(1, audioContext.sampleRate * release, audioContext.sampleRate);
    const channelData = buffer.getChannelData(0);

    for (let i = 0; i < channelData.length; i++) {
        channelData[i] = Math.sin(2 * Math.PI * frequencies[note] * (i / audioContext.sampleRate)) * adjustedGain;
    }

    return buffer; // 🔥 Teraz funkcja zwraca AudioBuffer zamiast void
};




export const highlightKey = (note: string, setActiveKeys: (callback: (prev: Set<string>) => Set<string>) => void) => {
    setActiveKeys((prev) => new Set(prev).add(note));
    setTimeout(() => {
        setActiveKeys((prev) => {
            const newSet = new Set(prev);
            newSet.delete(note);
            return newSet;
        });
    }, 200);
};
