"""
generate_sf2_notes.py — Extract and render individual note WAV files from SF2 SoundFonts.

This is a minimal SF2 parser that reads sample data directly from the RIFF/sfbk
structure, finds the best matching sample for each MIDI note, resamples if needed,
applies an ADSR envelope, and writes mono 16-bit WAV files.

Usage:
    python generate_sf2_notes.py <sf2_path> <output_dir> [--program N]

Produces: output_dir/note-{64..77}.wav
"""
import os, sys, struct, wave, argparse
import numpy as np
from typing import List, Tuple, Optional


# ─── SF2 RIFF chunk parsing ────────────────────────────────────────
def read_u32(data: bytes, off: int) -> int:
    return struct.unpack_from('<I', data, off)[0]

def read_u16(data: bytes, off: int) -> int:
    return struct.unpack_from('<H', data, off)[0]

def read_i16(data: bytes, off: int) -> int:
    return struct.unpack_from('<h', data, off)[0]

def read_i8(data: bytes, off: int) -> int:
    return struct.unpack_from('<b', data, off)[0]

def read_u8(data: bytes, off: int) -> int:
    return struct.unpack_from('<B', data, off)[0]


class SF2Sample:
    """Represents one sample header from the shdr sub-chunk."""
    def __init__(self, name: str, start: int, end: int, loop_start: int,
                 loop_end: int, sample_rate: int, original_pitch: int,
                 pitch_correction: int, sample_type: int):
        self.name = name
        self.start = start
        self.end = end
        self.loop_start = loop_start
        self.loop_end = loop_end
        self.sample_rate = sample_rate
        self.original_pitch = original_pitch
        self.pitch_correction = pitch_correction
        self.sample_type = sample_type


def parse_sf2(path: str) -> Tuple[np.ndarray, List[SF2Sample]]:
    """Parse an SF2 file and return (sample_data_i16, sample_headers)."""
    with open(path, 'rb') as f:
        data = f.read()

    # Verify RIFF header
    assert data[:4] == b'RIFF', f"Not a RIFF file: {path}"
    assert data[8:12] == b'sfbk', f"Not an SF2 file: {path}"

    samples_i16: Optional[np.ndarray] = None
    sample_headers: List[SF2Sample] = []

    def parse_chunks(data: bytes, start: int, end: int, depth: int = 0):
        nonlocal samples_i16, sample_headers
        pos = start
        while pos < end - 8:
            chunk_id = data[pos:pos+4].decode('ascii', errors='replace')
            chunk_size = read_u32(data, pos + 4)
            chunk_data_start = pos + 8

            if chunk_id in ('RIFF', 'LIST'):
                list_type = data[chunk_data_start:chunk_data_start+4].decode('ascii', errors='replace')
                parse_chunks(data, chunk_data_start + 4, chunk_data_start + chunk_size, depth + 1)
            elif chunk_id == 'smpl':
                # Raw 16-bit PCM sample data
                n_samples = chunk_size // 2
                samples_i16 = np.frombuffer(data[chunk_data_start:chunk_data_start + n_samples * 2], dtype=np.int16)
            elif chunk_id == 'shdr':
                # Sample headers — 46 bytes each
                n_headers = chunk_size // 46
                for i in range(n_headers):
                    off = chunk_data_start + i * 46
                    name = data[off:off+20].split(b'\x00')[0].decode('ascii', errors='replace')
                    s_start = read_u32(data, off + 20)
                    s_end = read_u32(data, off + 24)
                    s_loop_start = read_u32(data, off + 28)
                    s_loop_end = read_u32(data, off + 32)
                    s_rate = read_u32(data, off + 36)
                    s_pitch = read_u8(data, off + 40)
                    s_correction = read_i8(data, off + 41)
                    s_type = read_u16(data, off + 44)
                    if name != 'EOS':  # Skip end-of-samples marker
                        sample_headers.append(SF2Sample(
                            name, s_start, s_end, s_loop_start, s_loop_end,
                            s_rate, s_pitch, s_correction, s_type
                        ))

            pos = chunk_data_start + chunk_size
            # Chunks are word-aligned
            if pos % 2 != 0:
                pos += 1

    parse_chunks(data, 0, len(data))
    assert samples_i16 is not None, "No sample data found in SF2"
    return samples_i16, sample_headers


def find_best_sample(headers: List[SF2Sample], midi_note: int) -> Optional[SF2Sample]:
    """Find the sample whose original_pitch is closest to the requested MIDI note.
    Only consider mono samples (type 1) or type 0."""
    candidates = [s for s in headers if s.sample_type in (0, 1) and s.original_pitch < 128]
    if not candidates:
        # fallback: try all
        candidates = [s for s in headers if s.original_pitch < 128]
    if not candidates:
        candidates = headers
    return min(candidates, key=lambda s: abs(s.original_pitch - midi_note))


def render_note(sample_data: np.ndarray, header: SF2Sample, midi_note: int,
                duration: float = 0.7, target_sr: int = 44100) -> np.ndarray:
    """Render a single note from SF2 sample data with pitch shifting and envelope."""
    # Extract raw sample
    start = header.start
    end = header.end
    if end > len(sample_data):
        end = len(sample_data)
    raw = sample_data[start:end].astype(np.float64) / 32768.0

    if len(raw) == 0:
        return np.zeros(int(duration * target_sr))

    # Pitch ratio: shift from original_pitch to target midi_note
    semitone_diff = midi_note - header.original_pitch - (header.pitch_correction / 100.0)
    pitch_ratio = 2.0 ** (semitone_diff / 12.0)

    # Resample
    src_sr = header.sample_rate
    # Number of source samples to cover `duration` seconds
    n_out = int(duration * target_sr)
    # Map output samples to source samples
    src_indices = np.arange(n_out) * (src_sr / target_sr) * pitch_ratio

    # If we run past the sample, either loop or pad
    max_idx = len(raw) - 1
    valid = src_indices <= max_idx
    out = np.zeros(n_out, dtype=np.float64)

    # Linear interpolation for valid samples
    valid_indices = src_indices[valid]
    lo = np.floor(valid_indices).astype(np.int64)
    hi = np.minimum(lo + 1, max_idx)
    frac = valid_indices - lo
    out[valid] = raw[lo] * (1 - frac) + raw[hi] * frac

    # Apply ADSR envelope
    env = adsr_envelope(n_out, target_sr)
    out *= env

    # Normalize
    peak = np.max(np.abs(out))
    if peak > 0.001:
        out = out / peak * 0.6

    return out


def adsr_envelope(n: int, sr: int,
                  attack=0.005, decay=0.08, sustain=0.3, release=0.4) -> np.ndarray:
    """Gentle ADSR for sampled notes."""
    env = np.ones(n, dtype=np.float64)
    a = int(attack * sr)
    d = int(decay * sr)
    r = int(release * sr)
    sus_end = n - r

    for i in range(n):
        if i < a:
            env[i] = i / max(a, 1)
        elif i < a + d:
            env[i] = 1.0 - (1.0 - sustain) * ((i - a) / max(d, 1))
        elif i < sus_end:
            frac = (i - a - d) / max(sus_end - a - d, 1)
            env[i] = sustain * (1.0 - 0.3 * frac)
        else:
            frac = (i - sus_end) / max(r, 1)
            env[i] = sustain * 0.7 * (1.0 - frac) ** 2
    return env


def write_wav(path: str, data: np.ndarray, sr: int = 44100):
    pcm = (np.clip(data, -1, 1) * 32767).astype(np.int16)
    with wave.open(path, 'w') as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sr)
        wf.writeframes(pcm.tobytes())


def midi_to_name(midi: int) -> str:
    names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    return f"{names[midi % 12]}{midi // 12 - 1}"


def main():
    parser = argparse.ArgumentParser(description='Generate WAV notes from SF2 SoundFont')
    parser.add_argument('sf2', help='Path to SF2 file')
    parser.add_argument('outdir', help='Output directory for WAV files')
    parser.add_argument('--midi-lo', type=int, default=64, help='Lowest MIDI note (default 64)')
    parser.add_argument('--midi-hi', type=int, default=77, help='Highest MIDI note (default 77)')
    parser.add_argument('--duration', type=float, default=0.7, help='Note duration in seconds')
    args = parser.parse_args()

    os.makedirs(args.outdir, exist_ok=True)

    print(f"Parsing SF2: {args.sf2}")
    sample_data, headers = parse_sf2(args.sf2)
    print(f"  Found {len(headers)} sample(s), {len(sample_data)} total PCM samples")

    # Show available samples
    pitches = sorted(set(s.original_pitch for s in headers if s.original_pitch < 128))
    print(f"  Available pitches: {pitches[:20]}{'...' if len(pitches) > 20 else ''}")

    for midi in range(args.midi_lo, args.midi_hi + 1):
        name = midi_to_name(midi)
        best = find_best_sample(headers, midi)
        if best is None:
            print(f"  ✗ MIDI {midi} ({name}) — no suitable sample found")
            continue

        out_path = os.path.join(args.outdir, f"note-{midi}.wav")
        signal = render_note(sample_data, best, midi, duration=args.duration)
        write_wav(out_path, signal)
        print(f"  ✓ MIDI {midi:3d} ({name:3s}) ← sample '{best.name}' (pitch {best.original_pitch}, sr {best.sample_rate}) → {os.path.getsize(out_path):,} bytes")

    print("Done!")


if __name__ == '__main__':
    main()
