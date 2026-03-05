// Timeline, snapping, waveform utilities, etc.
import { WaveformData } from '../models/editor/timelineTypes';

// Snapping to grid
export function snapToGrid(time: number, snapMode: 'beat' | 'bar' | 'off', bpm: number, quantize: number = 1): number {
    if (snapMode === 'off') return time;
    const beatLength = 60 / bpm;
    if (snapMode === 'beat') {
        return Math.round(time / (beatLength / quantize)) * (beatLength / quantize);
    }
    if (snapMode === 'bar') {
        // Assume 4/4
        const barLength = beatLength * 4;
        return Math.round(time / barLength) * barLength;
    }
    return time;
}

// Merging waveforms (e.g. after clip editing)
export function mergeWaveforms(waveforms: WaveformData[]): WaveformData {
    // Simple implementation: merges channel samples
    if (waveforms.length === 0) return [];
    return waveforms.flat();
}

// Generating waveform placeholder (e.g. for empty clips)
export function generatePlaceholderWaveform(duration: number, sampleRate: number = 44100): WaveformData {
    return new Array(Math.floor(duration * sampleRate)).fill(0);
}
