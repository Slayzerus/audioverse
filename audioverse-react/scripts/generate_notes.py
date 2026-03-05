"""
Generate individual WAV note samples using numpy synthesis.
Produces one file per MIDI note in the range used by NoteRiver (64-77).
Each note is a rich piano-like tone with harmonics, ADSR, and slight
detuning for warmth.  Output: public/assets/soundfonts/notes/note-{midi}.wav
"""
import os, struct, wave
import numpy as np

OUT_DIR   = os.path.join(os.path.dirname(__file__), '..', 'public', 'assets', 'soundfonts', 'notes')
MIDI_LO   = 64   # E4
MIDI_HI   = 77   # F5
SAMPLE_RATE = 44100
DURATION    = 0.7   # seconds


def midi_to_freq(midi: int) -> float:
    return 440.0 * 2 ** ((midi - 69) / 12.0)


def midi_to_name(midi: int) -> str:
    names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    return f"{names[midi % 12]}{midi // 12 - 1}"


def adsr_envelope(n_samples: int, sr: int,
                  attack=0.003, decay=0.06, sustain_level=0.18,
                  release=0.45) -> np.ndarray:
    """Soft ADSR envelope — gentle celesta / music-box feel."""
    env = np.zeros(n_samples, dtype=np.float64)
    a = int(attack * sr)
    d = int(decay * sr)
    r = int(release * sr)
    sustain_end = n_samples - r

    for i in range(n_samples):
        if i < a:
            env[i] = i / max(a, 1)
        elif i < a + d:
            env[i] = 1.0 - (1.0 - sustain_level) * ((i - a) / max(d, 1))
        elif i < sustain_end:
            # gentle decay during sustain
            frac = (i - a - d) / max(sustain_end - a - d, 1)
            env[i] = sustain_level * (1.0 - 0.4 * frac)
        else:
            frac = (i - sustain_end) / max(r, 1)
            # smooth exponential-ish release
            env[i] = sustain_level * 0.6 * (1.0 - frac) ** 2
    return env


def synthesize_note(midi: int) -> np.ndarray:
    """Render a celesta / music-box tone — subtle, glassy, pleasant."""
    freq = midi_to_freq(midi)
    n = int(DURATION * SAMPLE_RATE)
    t = np.linspace(0, DURATION, n, endpoint=False)
    env = adsr_envelope(n, SAMPLE_RATE)

    # Celesta-like spectrum: strong fundamental, very quiet upper partials,
    # slight inharmonicity (like struck metal bars)
    harmonics = [
        (1.0,   1.0,    0),      # fundamental — pure tone
        (0.25,  2.0,    0.4),    # octave — gentle
        (0.08,  3.0,   -0.6),    # 12th — barely there
        (0.03,  4.003,  1.0),    # double-octave — slight inharmonicity
        (0.01,  5.01,  -0.8),    # shimmer
    ]

    signal = np.zeros(n, dtype=np.float64)
    for amp, mult, detune_cents in harmonics:
        f = freq * mult * 2 ** (detune_cents / 1200.0)
        # higher partials die out faster — gives the "ding" quality
        harm_decay = np.exp(-t * mult * 4.0)
        signal += amp * np.sin(2.0 * np.pi * f * t) * harm_decay

    signal *= env

    # very mild soft-clip — keep it clean
    signal = np.tanh(signal * 0.5)

    # normalise to moderate level (subtle!)
    peak = np.max(np.abs(signal))
    if peak > 0:
        signal = signal / peak * 0.55

    return signal


def write_wav(path: str, data: np.ndarray, sr: int = SAMPLE_RATE):
    """Write a mono 16-bit WAV file."""
    pcm = (data * 32767).astype(np.int16)
    with wave.open(path, 'w') as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sr)
        wf.writeframes(pcm.tobytes())


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    print(f"Generating piano-like WAV notes (MIDI {MIDI_LO}–{MIDI_HI})")
    for midi in range(MIDI_LO, MIDI_HI + 1):
        name = midi_to_name(midi)
        out = os.path.join(OUT_DIR, f"note-{midi}.wav")
        sig = synthesize_note(midi)
        write_wav(out, sig)
        print(f"  ✓ MIDI {midi:3d} ({name:3s}) → note-{midi}.wav  ({os.path.getsize(out):,} bytes)")
    print(f"\nDone — {MIDI_HI - MIDI_LO + 1} notes in {OUT_DIR}")


if __name__ == '__main__':
    main()
