/**
 * Timeline drawing utilities with snap-to-grid and time ruler
 */

export interface TimelineConfig {
    zoom: number;
    duration: number;
    bpm: number;
    snapEnabled: boolean;
    snapMode: 'beat' | 'bar' | 'second' | 'sub-beat';
}

export type WaveformData = number[];

/**
 * Calculate snap interval based on mode and BPM
 */
export function getSnapInterval(config: TimelineConfig): number {
    const beatsPerSecond = config.bpm / 60;
    
    switch (config.snapMode) {
        case 'bar':
            return 4 / beatsPerSecond; // 4 beats per bar
        case 'beat':
            return 1 / beatsPerSecond;
        case 'sub-beat':
            return 1 / (beatsPerSecond * 4); // 16th notes
        case 'second':
        default:
            return 1;
    }
}

/**
 * Snap time to grid
 */
export function snapToGrid(time: number, config: TimelineConfig): number {
    if (!config.snapEnabled) return time;
    
    const interval = getSnapInterval(config);
    return Math.round(time / interval) * interval;
}

/**
 * Format time for display
 */
export function formatTime(seconds: number, showMillis = false): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    
    if (showMillis) {
        return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format time as bars:beats
 */
export function formatMusicalTime(seconds: number, bpm: number): string {
    const beatsPerSecond = bpm / 60;
    const totalBeats = seconds * beatsPerSecond;
    const bars = Math.floor(totalBeats / 4);
    const beats = Math.floor(totalBeats % 4);
    
    return `${bars + 1}:${beats + 1}`;
}

export function drawTimeline(canvas: HTMLCanvasElement, zoom: number, duration: number) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = 30 * zoom * duration;
    const height = 30 * zoom;

    canvas.width = width;
    canvas.height = height;

    ctx.clearRect(0, 0, width, height);

    // Drawing guide lines (every 1s)
    ctx.strokeStyle = "var(--border-secondary, gray)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= duration; i++) {
        const x = (i / duration) * width;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
    }
}

/**
 * Draw enhanced timeline with ruler
 */
export function drawTimelineWithRuler(
    canvas: HTMLCanvasElement,
    config: TimelineConfig,
    showMusicalTime: boolean = true
) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = 30 * config.zoom * config.duration;
    const height = Math.max(80, 30 * config.zoom);

    canvas.width = width;
    canvas.height = height;

    ctx.clearRect(0, 0, width, height);
    
    // Background
    ctx.fillStyle = "var(--surface-bg, #f5f5f5)";
    ctx.fillRect(0, 0, width, height);

    // Calculate appropriate grid interval based on zoom
    const pixelsPerSecond = width / config.duration;
    let gridInterval = 1; // seconds
    
    if (pixelsPerSecond < 30) {
        gridInterval = 5;
    } else if (pixelsPerSecond < 60) {
        gridInterval = 2;
    } else if (pixelsPerSecond > 150) {
        gridInterval = 0.5;
    }
    
    // Draw grid lines
    ctx.strokeStyle = "var(--border-secondary, #ddd)";
    ctx.lineWidth = 1;
    
    for (let t = 0; t <= config.duration; t += gridInterval) {
        const x = (t / config.duration) * width;
        
        // Major grid lines every full second/bar
        const isMajor = t % 1 === 0;
        ctx.strokeStyle = isMajor ? "var(--border-secondary, #ccc)" : "var(--border-muted, #eee)";
        ctx.lineWidth = isMajor ? 1.5 : 0.5;
        
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
        
        // Time labels
        if (isMajor && pixelsPerSecond > 40) {
            ctx.fillStyle = "var(--muted, #666)";
            ctx.font = "10px monospace";
            ctx.textAlign = "center";
            
            const label = showMusicalTime 
                ? formatMusicalTime(t, config.bpm)
                : formatTime(t);
            
            ctx.fillText(label, x, 12);
        }
    }
    
    // Snap indicators (if enabled)
    if (config.snapEnabled) {
        const snapInterval = getSnapInterval(config);
        ctx.strokeStyle = "var(--accent-primary, #ffeb3b)";
        ctx.lineWidth = 0.5;
        
        for (let t = 0; t <= config.duration; t += snapInterval) {
            const x = (t / config.duration) * width;
            ctx.beginPath();
            ctx.moveTo(x, height - 5);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
    }
}

// Drawing time cursor (animation)
export function drawCursor(
    canvas: HTMLCanvasElement,
    zoom: number,
    duration: number,
    currentTime: number,
    isRecording: boolean
) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = 30 * zoom * duration;
    const height = 30 * zoom;
    const x = (currentTime / duration) * width;

    drawTimeline(canvas, zoom, duration);

    ctx.strokeStyle = isRecording ? "var(--danger, #f44336)" : "var(--text-primary, #000)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
}

/**
 * Draw cursor with enhanced visualization
 */
export function drawCursorEnhanced(
    canvas: HTMLCanvasElement,
    config: TimelineConfig,
    currentTime: number,
    isRecording: boolean
) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = 30 * config.zoom * config.duration;
    const height = Math.max(80, 30 * config.zoom);
    const x = (currentTime / config.duration) * width;

    // Redraw timeline first
    drawTimelineWithRuler(canvas, config);

    // Draw playhead
    ctx.strokeStyle = isRecording ? "var(--danger, #f44336)" : "var(--accent-primary, #2196f3)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
    
    // Draw playhead handle
    ctx.fillStyle = isRecording ? "var(--danger, #f44336)" : "var(--accent-primary, #2196f3)";
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x - 5, -8);
    ctx.lineTo(x + 5, -8);
    ctx.closePath();
    ctx.fill();
}

/**
 * Generate a deterministic placeholder waveform when no audio peaks are available.
 */
export function generatePlaceholderWaveform(seed: string, sampleCount: number = 1024): WaveformData {
    // Simple LCG for repeatable pseudo-randomness per layer/name
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
    }
    const samples: number[] = [];
    let state = hash || 1;
    for (let i = 0; i < sampleCount; i++) {
        state = (1664525 * state + 1013904223) % 4294967296;
        const value = ((state / 4294967296) * 2 - 1) * Math.sin((i / sampleCount) * Math.PI * 2);
        samples.push(Math.max(-1, Math.min(1, value)));
    }
    return samples;
}

/**
 * Draw waveform over the timeline surface.
 */
export function drawWaveform(
    canvas: HTMLCanvasElement,
    config: TimelineConfig,
    waveform: WaveformData,
    color: string = "var(--success, #4caf50)"
) {
    const ctx = canvas.getContext("2d");
    if (!ctx || !waveform?.length) return;

    const width = 30 * config.zoom * config.duration;
    const height = canvas.height;
    const centerY = height / 2;
    const halfHeight = Math.max(10, centerY - 6);

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    waveform.forEach((value, index) => {
        const x = (index / (waveform.length - 1)) * width;
        const y = centerY - value * halfHeight;
        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    ctx.stroke();
    ctx.restore();
}

/**
 * Merge multiple waveforms into a single averaged waveform for mini-map rendering.
 */
export function mergeWaveforms(waveforms: WaveformData[], targetLength: number = 512): WaveformData {
    if (!waveforms.length) return new Array(targetLength).fill(0);
    const merged = new Array(targetLength).fill(0);
    const counts = new Array(targetLength).fill(0);

    waveforms.forEach((wf) => {
        if (!wf?.length) return;
        for (let i = 0; i < targetLength; i++) {
            const srcIndex = Math.floor((i / targetLength) * (wf.length - 1));
            merged[i] += wf[srcIndex];
            counts[i] += 1;
        }
    });

    return merged.map((val, idx) => (counts[idx] ? val / counts[idx] : 0));
}

/**
 * Draw compact mini-map with aggregated waveform and playhead marker.
 */
export function drawMiniMap(
    canvas: HTMLCanvasElement,
    config: TimelineConfig,
    waveform: WaveformData,
    currentTime: number
) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.clientWidth || canvas.width || 300;
    const height = canvas.clientHeight || canvas.height || 80;
    canvas.width = width;
    canvas.height = height;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "var(--surface-bg, #fafafa)";
    ctx.fillRect(0, 0, width, height);

    // Grid background
    ctx.strokeStyle = "var(--border-muted, #ececec)";
    ctx.lineWidth = 1;
    const gridCount = Math.max(4, Math.floor(width / 80));
    for (let i = 0; i <= gridCount; i++) {
        const x = (i / gridCount) * width;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
    }

    if (waveform?.length) {
        const centerY = height / 2;
        const halfHeight = Math.max(12, centerY - 4);
        ctx.strokeStyle = "var(--success, #9ccc65)";
        ctx.lineWidth = 0.75;
        ctx.beginPath();
        waveform.forEach((value, index) => {
            const x = (index / (waveform.length - 1)) * width;
            const y = centerY - value * halfHeight;
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.stroke();
    }

    // Playhead marker
    const playheadX = Math.min(width, Math.max(0, (currentTime / config.duration) * width));
    ctx.strokeStyle = "var(--accent-primary, #2196f3)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(playheadX, 0);
    ctx.lineTo(playheadX, height);
    ctx.stroke();
}

