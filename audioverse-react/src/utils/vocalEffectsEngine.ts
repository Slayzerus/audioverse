// vocalEffectsEngine.ts — Live microphone vocal effects engine.
// Uses Web Audio API to apply real-time effects to mic input.
// Effects are stackable — multiple can be active simultaneously.
// Output goes to speakers (monitor) so user hears processed voice.

export type VocalEffectType =
    | "chipmunk"      // Pitch shift up (high-pitch voice)
    | "deep"          // Pitch shift down (deep voice)
    | "robot"         // Robotic voice (ring modulation)
    | "echo"          // Echo/delay
    | "reverb"        // Large reverb (cathedral)
    | "chorus"        // Chorus (slight detuning/doubling)
    | "flanger"       // Flanger sweep
    | "distortion"    // Distortion/overdrive
    | "telephone"     // Telephone filter (bandpass)
    | "megaphone"     // Megaphone (distortion + bandpass)
    | "whisper"       // Whispered voice (spectral filtering)
    | "alien"         // Alien voice (extreme pitch + ring mod)
    | "underwater"    // Underwater (lowpass + wobble)
    | "radio"         // AM radio (bandpass + slight distortion)
    | "cave"          // Cave echo (long delay + reverb)
    | "helium"        // Helium voice (extreme pitch up)
    | "demon"         // Demon voice (extreme pitch down + distortion)
    | "tremolo"       // Volume tremolo
    | "autotune"      // Auto-tune style (pitch quantization approximation)
    | "vocoder";      // Simple vocoder-style effect

export interface VocalEffectConfig {
    type: VocalEffectType;
    enabled: boolean;
    /** Effect-specific parameter (0-100). Meaning depends on effect type. */
    intensity: number;
    /** Display name */
    label: string;
    /** Emoji icon */
    icon: string;
}

export const ALL_EFFECTS: VocalEffectConfig[] = [
    { type: "chipmunk",   enabled: false, intensity: 60,  label: "Chipmunk",   icon: "🐿️" },
    { type: "helium",     enabled: false, intensity: 80,  label: "Helium",     icon: "🎈" },
    { type: "deep",       enabled: false, intensity: 50,  label: "Deep Voice", icon: "🎸" },
    { type: "demon",      enabled: false, intensity: 70,  label: "Demon",      icon: "😈" },
    { type: "robot",      enabled: false, intensity: 50,  label: "Robot",      icon: "🤖" },
    { type: "alien",      enabled: false, intensity: 60,  label: "Alien",      icon: "👽" },
    { type: "echo",       enabled: false, intensity: 50,  label: "Echo",       icon: "🏔️" },
    { type: "cave",       enabled: false, intensity: 60,  label: "Cave",       icon: "🕳️" },
    { type: "reverb",     enabled: false, intensity: 50,  label: "Reverb",     icon: "⛪" },
    { type: "chorus",     enabled: false, intensity: 50,  label: "Chorus",     icon: "🎵" },
    { type: "flanger",    enabled: false, intensity: 50,  label: "Flanger",    icon: "🌊" },
    { type: "distortion", enabled: false, intensity: 40,  label: "Distortion", icon: "🔥" },
    { type: "telephone",  enabled: false, intensity: 80,  label: "Telephone",  icon: "📞" },
    { type: "megaphone",  enabled: false, intensity: 60,  label: "Megaphone",  icon: "📢" },
    { type: "radio",      enabled: false, intensity: 70,  label: "AM Radio",   icon: "📻" },
    { type: "underwater", enabled: false, intensity: 50,  label: "Underwater", icon: "🌊" },
    { type: "whisper",    enabled: false, intensity: 60,  label: "Whisper",    icon: "🤫" },
    { type: "tremolo",    enabled: false, intensity: 50,  label: "Tremolo",    icon: "〰️" },
    { type: "autotune",   enabled: false, intensity: 60,  label: "Auto-Tune",  icon: "🎤" },
    { type: "vocoder",    enabled: false, intensity: 50,  label: "Vocoder",    icon: "🔊" },
];

/** Internal node chain for a single effect */
interface EffectChainEntry {
    type: VocalEffectType;
    nodes: AudioNode[];
    input: AudioNode;
    output: AudioNode;
}

/**
 * Generate a reverb impulse response.
 */
function createImpulseResponse(ctx: AudioContext, duration: number, decay: number): AudioBuffer {
    const rate = ctx.sampleRate;
    const length = Math.round(rate * duration);
    const buf = ctx.createBuffer(2, length, rate);
    for (let ch = 0; ch < 2; ch++) {
        const data = buf.getChannelData(ch);
        for (let i = 0; i < length; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
        }
    }
    return buf;
}

/**
 * Generate a distortion curve for WaveShaperNode.
 */
function makeDistortionCurve(amount: number): Float32Array {
    const k = Math.max(1, amount);
    const samples = 44100;
    const curve = new Float32Array(samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < samples; i++) {
        const x = (i * 2) / samples - 1;
        curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
}

export class VocalEffectsEngine {
    private audioCtx: AudioContext | null = null;
    private mediaStream: MediaStream | null = null;
    private sourceNode: MediaStreamAudioSourceNode | null = null;
    private inputGain: GainNode | null = null;
    private outputGain: GainNode | null = null;
    private activeEffects: Map<VocalEffectType, EffectChainEntry> = new Map();
    private effectOrder: VocalEffectType[] = [];
    private monitoring = true;
    private _volume = 1.0;
    private _inputVolume = 1.0;
    private started = false;
    private externalStream = false;
    private analyser: AnalyserNode | null = null;

    get isStarted(): boolean { return this.started; }
    get context(): AudioContext | null { return this.audioCtx; }
    get activeEffectTypes(): VocalEffectType[] { return [...this.effectOrder]; }

    // ── Start / Stop ─────────────────────────────────────────────────

    async start(deviceId?: string): Promise<void> {
        if (this.started) return;
        this.audioCtx = new AudioContext();
        this.mediaStream = await navigator.mediaDevices.getUserMedia({
            audio: {
                deviceId: deviceId || undefined,
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: false,
            },
        });
        this.sourceNode = this.audioCtx.createMediaStreamSource(this.mediaStream);

        this.inputGain = this.audioCtx.createGain();
        this.inputGain.gain.value = this._inputVolume;
        this.sourceNode.connect(this.inputGain);

        this.outputGain = this.audioCtx.createGain();
        this.outputGain.gain.value = this.monitoring ? this._volume : 0;

        this.analyser = this.audioCtx.createAnalyser();
        this.analyser.fftSize = 2048;

        // Default chain: input → output → analyser → destination
        this.inputGain.connect(this.outputGain);
        this.outputGain.connect(this.analyser);
        this.analyser.connect(this.audioCtx.destination);

        this.started = true;
    }

    async startWithStream(stream: MediaStream): Promise<void> {
        if (this.started) return;
        this.externalStream = true;
        this.audioCtx = new AudioContext();
        this.mediaStream = stream;
        this.sourceNode = this.audioCtx.createMediaStreamSource(stream);

        this.inputGain = this.audioCtx.createGain();
        this.inputGain.gain.value = this._inputVolume;
        this.sourceNode.connect(this.inputGain);

        this.outputGain = this.audioCtx.createGain();
        this.outputGain.gain.value = this.monitoring ? this._volume : 0;

        this.analyser = this.audioCtx.createAnalyser();
        this.analyser.fftSize = 2048;

        this.inputGain.connect(this.outputGain);
        this.outputGain.connect(this.analyser);
        this.analyser.connect(this.audioCtx.destination);

        this.started = true;
    }

    stop(): void {
        this.clearAllEffects();
        try { this.analyser?.disconnect(); } catch { /* Expected: audio node may already be disconnected during cleanup */ }
        try { this.outputGain?.disconnect(); } catch { /* Expected: audio node may already be disconnected during cleanup */ }
        try { this.inputGain?.disconnect(); } catch { /* Expected: audio node may already be disconnected during cleanup */ }
        try { this.sourceNode?.disconnect(); } catch { /* Expected: audio node may already be disconnected during cleanup */ }
        try { this.audioCtx?.close(); } catch { /* Expected: AudioContext may already be closed */ }
        if (!this.externalStream) {
            try { this.mediaStream?.getTracks().forEach(t => t.stop()); } catch { /* Expected: tracks may already be stopped */ }
        }
        this.audioCtx = null;
        this.mediaStream = null;
        this.sourceNode = null;
        this.inputGain = null;
        this.outputGain = null;
        this.analyser = null;
        this.started = false;
    }

    // ── Volume / Monitoring ──────────────────────────────────────────

    setMonitoring(enabled: boolean): void {
        this.monitoring = enabled;
        if (this.outputGain) {
            this.outputGain.gain.value = enabled ? this._volume : 0;
        }
    }

    setVolume(vol: number): void {
        this._volume = Math.max(0, Math.min(2, vol));
        if (this.outputGain && this.monitoring) {
            this.outputGain.gain.value = this._volume;
        }
    }

    setInputGain(gain: number): void {
        this._inputVolume = Math.max(0, Math.min(3, gain));
        if (this.inputGain) {
            this.inputGain.gain.value = this._inputVolume;
        }
    }

    /** Get current audio level (RMS) */
    getLevel(): number {
        if (!this.analyser) return 0;
        const data = new Uint8Array(this.analyser.fftSize);
        this.analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
            const v = (data[i] - 128) / 128;
            sum += v * v;
        }
        return Math.sqrt(sum / data.length);
    }

    // ── Effect management ────────────────────────────────────────────

    addEffect(type: VocalEffectType, intensity = 50): void {
        if (!this.audioCtx || !this.inputGain || !this.outputGain) return;
        if (this.activeEffects.has(type)) return;

        const chain = this.buildEffectChain(type, intensity);
        if (!chain) return;

        this.activeEffects.set(type, chain);
        this.effectOrder.push(type);
        this.reconnectChain();
    }

    removeEffect(type: VocalEffectType): void {
        const entry = this.activeEffects.get(type);
        if (!entry) return;
        // Disconnect all nodes
        for (const node of entry.nodes) {
            try { node.disconnect(); } catch { /* Expected: audio node may already be disconnected */ }
        }
        this.activeEffects.delete(type);
        this.effectOrder = this.effectOrder.filter(t => t !== type);
        this.reconnectChain();
    }

    toggleEffect(type: VocalEffectType, intensity = 50): boolean {
        if (this.activeEffects.has(type)) {
            this.removeEffect(type);
            return false;
        } else {
            this.addEffect(type, intensity);
            return true;
        }
    }

    updateIntensity(type: VocalEffectType, intensity: number): void {
        if (!this.activeEffects.has(type)) return;
        this.removeEffect(type);
        this.addEffect(type, intensity);
    }

    clearAllEffects(): void {
        for (const [type] of this.activeEffects) {
            const entry = this.activeEffects.get(type);
            if (entry) {
                for (const node of entry.nodes) {
                    try { node.disconnect(); } catch { /* Expected: audio node may already be disconnected */ }
                }
            }
        }
        this.activeEffects.clear();
        this.effectOrder = [];
        this.reconnectChain();
    }

    // ── Chain wiring ─────────────────────────────────────────────────

    private reconnectChain(): void {
        if (!this.inputGain || !this.outputGain) return;

        // Disconnect input from everything
        try { this.inputGain.disconnect(); } catch { /* Expected: input node may already be disconnected */ }

        // Disconnect all effects from each other
        for (const [, entry] of this.activeEffects) {
            try { entry.output.disconnect(); } catch { /* Expected: effect output may already be disconnected */ }
        }

        if (this.effectOrder.length === 0) {
            // Direct: input → output
            this.inputGain.connect(this.outputGain);
            return;
        }

        // Chain: input → effect1 → effect2 → ... → output
        let prev: AudioNode = this.inputGain;
        for (const type of this.effectOrder) {
            const entry = this.activeEffects.get(type);
            if (!entry) continue;
            prev.connect(entry.input);
            prev = entry.output;
        }
        prev.connect(this.outputGain);
    }

    // ── Effect builders ──────────────────────────────────────────────

    private buildEffectChain(type: VocalEffectType, intensity: number): EffectChainEntry | null {
        const ctx = this.audioCtx!;
        const norm = intensity / 100; // 0-1

        switch (type) {
            case "chipmunk":
                return this.buildPitchShift(ctx, 1 + norm * 0.8, norm);
            case "helium":
                return this.buildPitchShift(ctx, 1.5 + norm * 1.0, norm);
            case "deep":
                return this.buildPitchShift(ctx, 1 / (1 + norm * 0.5), norm);
            case "demon":
                return this.buildDemon(ctx, norm);
            case "robot":
                return this.buildRobot(ctx, norm);
            case "alien":
                return this.buildAlien(ctx, norm);
            case "echo":
                return this.buildDelay(ctx, 0.15 + norm * 0.35, 0.3 + norm * 0.4, norm);
            case "cave":
                return this.buildCave(ctx, norm);
            case "reverb":
                return this.buildReverb(ctx, 1.5 + norm * 3.0, 2 + norm * 4, norm);
            case "chorus":
                return this.buildChorus(ctx, norm);
            case "flanger":
                return this.buildFlanger(ctx, norm);
            case "distortion":
                return this.buildDistortion(ctx, 20 + norm * 100, norm);
            case "telephone":
                return this.buildBandpass(ctx, 400, 3500, norm);
            case "megaphone":
                return this.buildMegaphone(ctx, norm);
            case "radio":
                return this.buildRadio(ctx, norm);
            case "underwater":
                return this.buildUnderwater(ctx, norm);
            case "whisper":
                return this.buildWhisper(ctx, norm);
            case "tremolo":
                return this.buildTremolo(ctx, norm);
            case "autotune":
                return this.buildAutotune(ctx, norm);
            case "vocoder":
                return this.buildVocoder(ctx, norm);
            default:
                return null;
        }
    }

    // Pitch shift using playbackRate on a delay-based approach
    // Uses oscillator-modulated delay for real-time pitch shifting
    private buildPitchShift(ctx: AudioContext, rate: number, mix: number): EffectChainEntry {
        // Use a pair of delay nodes with LFO modulation to create pitch shift effect
        const inputGain = ctx.createGain();
        inputGain.gain.value = 1;

        const outputGain = ctx.createGain();
        outputGain.gain.value = 1;

        const wetGain = ctx.createGain();
        wetGain.gain.value = 0.7 + mix * 0.3;
        const dryGain = ctx.createGain();
        dryGain.gain.value = 1 - mix * 0.5;

        // Granular pitch shift via modulated delay
        const delay1 = ctx.createDelay(1);
        const delay2 = ctx.createDelay(1);
        const lfo1 = ctx.createOscillator();
        const lfo2 = ctx.createOscillator();
        const lfoGain1 = ctx.createGain();
        const lfoGain2 = ctx.createGain();

        const pitchFactor = rate - 1; // deviation from 1.0
        const lfoFreq = Math.abs(pitchFactor) * 5 + 2;
        const lfoDepth = Math.abs(pitchFactor) * 0.015;

        lfo1.type = "sawtooth";
        lfo1.frequency.value = lfoFreq;
        lfoGain1.gain.value = lfoDepth;
        lfo1.connect(lfoGain1);
        lfoGain1.connect(delay1.delayTime);
        delay1.delayTime.value = 0.02;

        lfo2.type = "sawtooth";
        lfo2.frequency.value = lfoFreq;
        lfoGain2.gain.value = lfoDepth;
        // Phase offset for crossfade
        lfo2.connect(lfoGain2);
        lfoGain2.connect(delay2.delayTime);
        delay2.delayTime.value = 0.02 + lfoDepth;

        const gain1 = ctx.createGain();
        gain1.gain.value = 0.5;
        const gain2 = ctx.createGain();
        gain2.gain.value = 0.5;

        inputGain.connect(delay1);
        inputGain.connect(delay2);
        delay1.connect(gain1);
        delay2.connect(gain2);
        gain1.connect(wetGain);
        gain2.connect(wetGain);

        inputGain.connect(dryGain);

        wetGain.connect(outputGain);
        dryGain.connect(outputGain);

        lfo1.start();
        lfo2.start();

        return {
            type: "chipmunk",
            nodes: [inputGain, delay1, delay2, lfo1, lfo2, lfoGain1, lfoGain2, gain1, gain2, wetGain, dryGain, outputGain],
            input: inputGain,
            output: outputGain,
        };
    }

    private buildRobot(ctx: AudioContext, mix: number): EffectChainEntry {
        const input = ctx.createGain();
        const output = ctx.createGain();
        const wet = ctx.createGain();
        wet.gain.value = 0.6 + mix * 0.4;
        const dry = ctx.createGain();
        dry.gain.value = 1 - mix * 0.6;

        // Ring modulator — multiply signal with carrier oscillator
        const osc = ctx.createOscillator();
        osc.type = "square";
        osc.frequency.value = 50 + mix * 200;

        const ringGain = ctx.createGain();
        ringGain.gain.value = 0;

        // The oscillator modulates the gain
        osc.connect(ringGain.gain);
        input.connect(ringGain);
        ringGain.connect(wet);

        input.connect(dry);
        wet.connect(output);
        dry.connect(output);

        osc.start();

        return {
            type: "robot",
            nodes: [input, osc, ringGain, wet, dry, output],
            input, output,
        };
    }

    private buildAlien(ctx: AudioContext, mix: number): EffectChainEntry {
        const input = ctx.createGain();
        const output = ctx.createGain();

        // Ring mod with higher frequency + pitch shift
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.value = 300 + mix * 700;

        const ringGain = ctx.createGain();
        ringGain.gain.value = 0;
        osc.connect(ringGain.gain);
        input.connect(ringGain);

        // Add a frequency shifter effect via modulated delays
        const delay = ctx.createDelay(0.1);
        delay.delayTime.value = 0.005;
        const lfo = ctx.createOscillator();
        lfo.type = "sine";
        lfo.frequency.value = 3 + mix * 10;
        const lfoG = ctx.createGain();
        lfoG.gain.value = 0.004;
        lfo.connect(lfoG);
        lfoG.connect(delay.delayTime);

        ringGain.connect(delay);
        delay.connect(output);

        // Dry path
        const dry = ctx.createGain();
        dry.gain.value = 0.3;
        input.connect(dry);
        dry.connect(output);

        osc.start();
        lfo.start();

        return {
            type: "alien",
            nodes: [input, osc, ringGain, delay, lfo, lfoG, dry, output],
            input, output,
        };
    }

    private buildDelay(ctx: AudioContext, time: number, feedback: number, mix: number): EffectChainEntry {
        const input = ctx.createGain();
        const output = ctx.createGain();

        const delay = ctx.createDelay(2);
        delay.delayTime.value = time;

        const fbGain = ctx.createGain();
        fbGain.gain.value = Math.min(0.85, feedback);

        const wet = ctx.createGain();
        wet.gain.value = 0.5 + mix * 0.5;
        const dry = ctx.createGain();
        dry.gain.value = 1;

        input.connect(delay);
        delay.connect(fbGain);
        fbGain.connect(delay); // feedback loop
        delay.connect(wet);

        input.connect(dry);
        wet.connect(output);
        dry.connect(output);

        return {
            type: "echo",
            nodes: [input, delay, fbGain, wet, dry, output],
            input, output,
        };
    }

    private buildCave(ctx: AudioContext, mix: number): EffectChainEntry {
        const input = ctx.createGain();
        const output = ctx.createGain();

        // Multiple delays for cave-like echo
        const d1 = ctx.createDelay(2);
        d1.delayTime.value = 0.2 + mix * 0.3;
        const d2 = ctx.createDelay(2);
        d2.delayTime.value = 0.35 + mix * 0.25;
        const d3 = ctx.createDelay(2);
        d3.delayTime.value = 0.55 + mix * 0.3;

        const fb1 = ctx.createGain(); fb1.gain.value = 0.5;
        const fb2 = ctx.createGain(); fb2.gain.value = 0.35;
        const fb3 = ctx.createGain(); fb3.gain.value = 0.25;

        // Reverb tail
        const convolver = ctx.createConvolver();
        convolver.buffer = createImpulseResponse(ctx, 2 + mix * 3, 3);

        const reverbGain = ctx.createGain();
        reverbGain.gain.value = 0.3 + mix * 0.3;

        input.connect(d1); d1.connect(fb1); fb1.connect(d1);
        input.connect(d2); d2.connect(fb2); fb2.connect(d2);
        input.connect(d3); d3.connect(fb3); fb3.connect(d3);

        d1.connect(reverbGain);
        d2.connect(reverbGain);
        d3.connect(reverbGain);

        input.connect(convolver);
        convolver.connect(reverbGain);

        const dry = ctx.createGain(); dry.gain.value = 0.7;
        input.connect(dry);
        dry.connect(output);
        reverbGain.connect(output);

        return {
            type: "cave",
            nodes: [input, d1, d2, d3, fb1, fb2, fb3, convolver, reverbGain, dry, output],
            input, output,
        };
    }

    private buildReverb(ctx: AudioContext, duration: number, decay: number, mix: number): EffectChainEntry {
        const input = ctx.createGain();
        const output = ctx.createGain();

        const convolver = ctx.createConvolver();
        convolver.buffer = createImpulseResponse(ctx, duration, decay);

        const wet = ctx.createGain();
        wet.gain.value = 0.4 + mix * 0.5;
        const dry = ctx.createGain();
        dry.gain.value = 1;

        input.connect(convolver);
        convolver.connect(wet);
        input.connect(dry);
        wet.connect(output);
        dry.connect(output);

        return {
            type: "reverb",
            nodes: [input, convolver, wet, dry, output],
            input, output,
        };
    }

    private buildChorus(ctx: AudioContext, mix: number): EffectChainEntry {
        const input = ctx.createGain();
        const output = ctx.createGain();

        // Multiple delayed + modulated copies
        const voices = [
            { delayMs: 20, lfoFreq: 0.5, depth: 0.003 },
            { delayMs: 25, lfoFreq: 0.7, depth: 0.004 },
            { delayMs: 30, lfoFreq: 1.1, depth: 0.005 },
        ];

        const nodes: AudioNode[] = [input, output];

        const dry = ctx.createGain();
        dry.gain.value = 0.7;
        input.connect(dry);
        dry.connect(output);
        nodes.push(dry);

        for (const v of voices) {
            const delay = ctx.createDelay(0.1);
            delay.delayTime.value = v.delayMs / 1000;
            const lfo = ctx.createOscillator();
            lfo.type = "sine";
            lfo.frequency.value = v.lfoFreq;
            const lfoG = ctx.createGain();
            lfoG.gain.value = v.depth * (0.5 + mix);
            lfo.connect(lfoG);
            lfoG.connect(delay.delayTime);

            const voiceGain = ctx.createGain();
            voiceGain.gain.value = (0.3 + mix * 0.2);

            input.connect(delay);
            delay.connect(voiceGain);
            voiceGain.connect(output);

            lfo.start();
            nodes.push(delay, lfo, lfoG, voiceGain);
        }

        return {
            type: "chorus",
            nodes,
            input, output,
        };
    }

    private buildFlanger(ctx: AudioContext, mix: number): EffectChainEntry {
        const input = ctx.createGain();
        const output = ctx.createGain();

        const delay = ctx.createDelay(0.02);
        delay.delayTime.value = 0.005;

        const lfo = ctx.createOscillator();
        lfo.type = "sine";
        lfo.frequency.value = 0.2 + mix * 2;
        const lfoG = ctx.createGain();
        lfoG.gain.value = 0.003 + mix * 0.002;
        lfo.connect(lfoG);
        lfoG.connect(delay.delayTime);

        const fb = ctx.createGain();
        fb.gain.value = 0.5 + mix * 0.35;

        const wet = ctx.createGain();
        wet.gain.value = 0.5 + mix * 0.3;
        const dry = ctx.createGain();
        dry.gain.value = 1;

        input.connect(delay);
        delay.connect(fb);
        fb.connect(delay);
        delay.connect(wet);
        input.connect(dry);
        wet.connect(output);
        dry.connect(output);

        lfo.start();

        return {
            type: "flanger",
            nodes: [input, delay, lfo, lfoG, fb, wet, dry, output],
            input, output,
        };
    }

    private buildDistortion(ctx: AudioContext, amount: number, mix: number): EffectChainEntry {
        const input = ctx.createGain();
        const output = ctx.createGain();

        const shaper = ctx.createWaveShaper();
        shaper.curve = makeDistortionCurve(amount);
        shaper.oversample = "4x";

        const wet = ctx.createGain();
        wet.gain.value = 0.6 + mix * 0.4;
        const dry = ctx.createGain();
        dry.gain.value = 1 - mix * 0.4;

        input.connect(shaper);
        shaper.connect(wet);
        input.connect(dry);
        wet.connect(output);
        dry.connect(output);

        return {
            type: "distortion",
            nodes: [input, shaper, wet, dry, output],
            input, output,
        };
    }

    private buildBandpass(ctx: AudioContext, lowFreq: number, highFreq: number, _mix: number): EffectChainEntry {
        const input = ctx.createGain();
        const output = ctx.createGain();

        const hp = ctx.createBiquadFilter();
        hp.type = "highpass";
        hp.frequency.value = lowFreq;
        hp.Q.value = 0.7;

        const lp = ctx.createBiquadFilter();
        lp.type = "lowpass";
        lp.frequency.value = highFreq;
        lp.Q.value = 0.7;

        input.connect(hp);
        hp.connect(lp);
        lp.connect(output);

        return {
            type: "telephone",
            nodes: [input, hp, lp, output],
            input, output,
        };
    }

    private buildMegaphone(ctx: AudioContext, mix: number): EffectChainEntry {
        const input = ctx.createGain();
        const output = ctx.createGain();

        // Bandpass
        const hp = ctx.createBiquadFilter();
        hp.type = "highpass";
        hp.frequency.value = 500;
        const lp = ctx.createBiquadFilter();
        lp.type = "lowpass";
        lp.frequency.value = 4000;

        // Slight distortion
        const shaper = ctx.createWaveShaper();
        shaper.curve = makeDistortionCurve(15 + mix * 30);
        shaper.oversample = "2x";

        // Boost presence
        const peak = ctx.createBiquadFilter();
        peak.type = "peaking";
        peak.frequency.value = 2000;
        peak.gain.value = 6 + mix * 6;
        peak.Q.value = 1;

        input.connect(hp);
        hp.connect(lp);
        lp.connect(shaper);
        shaper.connect(peak);
        peak.connect(output);

        return {
            type: "megaphone",
            nodes: [input, hp, lp, shaper, peak, output],
            input, output,
        };
    }

    private buildRadio(ctx: AudioContext, mix: number): EffectChainEntry {
        const input = ctx.createGain();
        const output = ctx.createGain();

        const hp = ctx.createBiquadFilter();
        hp.type = "highpass";
        hp.frequency.value = 300 + mix * 200;
        const lp = ctx.createBiquadFilter();
        lp.type = "lowpass";
        lp.frequency.value = 3000 - mix * 500;
        const peak = ctx.createBiquadFilter();
        peak.type = "peaking";
        peak.frequency.value = 1500;
        peak.gain.value = 8;
        peak.Q.value = 2;

        // Light distortion
        const shaper = ctx.createWaveShaper();
        shaper.curve = makeDistortionCurve(10);

        input.connect(hp);
        hp.connect(lp);
        lp.connect(peak);
        peak.connect(shaper);
        shaper.connect(output);

        return {
            type: "radio",
            nodes: [input, hp, lp, peak, shaper, output],
            input, output,
        };
    }

    private buildUnderwater(ctx: AudioContext, mix: number): EffectChainEntry {
        const input = ctx.createGain();
        const output = ctx.createGain();

        // Heavy lowpass
        const lp = ctx.createBiquadFilter();
        lp.type = "lowpass";
        lp.frequency.value = 300 + (1 - mix) * 400;
        lp.Q.value = 5 + mix * 10;

        // Wobble LFO on filter frequency
        const lfo = ctx.createOscillator();
        lfo.type = "sine";
        lfo.frequency.value = 0.5 + mix * 2;
        const lfoG = ctx.createGain();
        lfoG.gain.value = 100 + mix * 200;
        lfo.connect(lfoG);
        lfoG.connect(lp.frequency);

        const wet = ctx.createGain();
        wet.gain.value = 0.7 + mix * 0.3;
        const dry = ctx.createGain();
        dry.gain.value = 0.3 - mix * 0.2;

        input.connect(lp);
        lp.connect(wet);
        input.connect(dry);
        wet.connect(output);
        dry.connect(output);

        lfo.start();

        return {
            type: "underwater",
            nodes: [input, lp, lfo, lfoG, wet, dry, output],
            input, output,
        };
    }

    private buildWhisper(ctx: AudioContext, mix: number): EffectChainEntry {
        const input = ctx.createGain();
        const output = ctx.createGain();

        // Remove low frequencies to simulate whisper
        const hp = ctx.createBiquadFilter();
        hp.type = "highpass";
        hp.frequency.value = 500 + mix * 500;
        hp.Q.value = 0.5;

        // Add noise-like character via slight distortion
        const shaper = ctx.createWaveShaper();
        const curve = new Float32Array(256);
        for (let i = 0; i < 256; i++) {
            const x = (i / 255) * 2 - 1;
            curve[i] = Math.sign(x) * Math.pow(Math.abs(x), 0.3 + mix * 0.5);
        }
        shaper.curve = curve as unknown as typeof shaper.curve;

        // High-shelf boost
        const shelf = ctx.createBiquadFilter();
        shelf.type = "highshelf";
        shelf.frequency.value = 3000;
        shelf.gain.value = 6 + mix * 6;

        input.connect(hp);
        hp.connect(shaper);
        shaper.connect(shelf);
        shelf.connect(output);

        return {
            type: "whisper",
            nodes: [input, hp, shaper, shelf, output],
            input, output,
        };
    }

    private buildDemon(ctx: AudioContext, mix: number): EffectChainEntry {
        const input = ctx.createGain();
        const output = ctx.createGain();

        // Pitch down via modulated delay
        const delay = ctx.createDelay(0.1);
        delay.delayTime.value = 0.03;
        const lfo = ctx.createOscillator();
        lfo.type = "sawtooth";
        lfo.frequency.value = 2 + mix * 3;
        const lfoG = ctx.createGain();
        lfoG.gain.value = 0.02 + mix * 0.015;
        lfo.connect(lfoG);
        lfoG.connect(delay.delayTime);

        // Distortion
        const shaper = ctx.createWaveShaper();
        shaper.curve = makeDistortionCurve(20 + mix * 50);
        shaper.oversample = "2x";

        // Sub-bass boost
        const lowShelf = ctx.createBiquadFilter();
        lowShelf.type = "lowshelf";
        lowShelf.frequency.value = 200;
        lowShelf.gain.value = 8 + mix * 8;

        const wet = ctx.createGain();
        wet.gain.value = 0.7 + mix * 0.3;
        const dry = ctx.createGain();
        dry.gain.value = 0.3;

        input.connect(delay);
        delay.connect(shaper);
        shaper.connect(lowShelf);
        lowShelf.connect(wet);

        input.connect(dry);
        wet.connect(output);
        dry.connect(output);

        lfo.start();

        return {
            type: "demon",
            nodes: [input, delay, lfo, lfoG, shaper, lowShelf, wet, dry, output],
            input, output,
        };
    }

    private buildTremolo(ctx: AudioContext, mix: number): EffectChainEntry {
        const input = ctx.createGain();
        const output = ctx.createGain();

        const tremoloGain = ctx.createGain();
        tremoloGain.gain.value = 1;

        const lfo = ctx.createOscillator();
        lfo.type = "sine";
        lfo.frequency.value = 3 + mix * 12;
        const lfoG = ctx.createGain();
        lfoG.gain.value = 0.3 + mix * 0.5;
        lfo.connect(lfoG);
        lfoG.connect(tremoloGain.gain);

        input.connect(tremoloGain);
        tremoloGain.connect(output);

        lfo.start();

        return {
            type: "tremolo",
            nodes: [input, tremoloGain, lfo, lfoG, output],
            input, output,
        };
    }

    private buildAutotune(ctx: AudioContext, mix: number): EffectChainEntry {
        // Approximation: subtle pitch correction via chorus-like detuning + resonant filter bank
        const input = ctx.createGain();
        const output = ctx.createGain();

        const delay = ctx.createDelay(0.05);
        delay.delayTime.value = 0.005;

        const lfo = ctx.createOscillator();
        lfo.type = "sine";
        lfo.frequency.value = 6 + mix * 8;
        const lfoG = ctx.createGain();
        lfoG.gain.value = 0.002 + mix * 0.002;
        lfo.connect(lfoG);
        lfoG.connect(delay.delayTime);

        // Resonant peaks at chromatic frequencies
        const filters: BiquadFilterNode[] = [];
        const notes = [261.6, 293.7, 329.6, 349.2, 392.0, 440.0, 493.9, 523.3]; // C4-C5
        const filterMerge = ctx.createGain();
        filterMerge.gain.value = 0.15;

        for (const freq of notes) {
            const f = ctx.createBiquadFilter();
            f.type = "peaking";
            f.frequency.value = freq;
            f.Q.value = 8 + mix * 15;
            f.gain.value = 4 + mix * 8;
            input.connect(f);
            f.connect(filterMerge);
            filters.push(f);
        }

        const dry = ctx.createGain();
        dry.gain.value = 0.7;
        const wet = ctx.createGain();
        wet.gain.value = 0.5 + mix * 0.3;

        input.connect(delay);
        delay.connect(wet);
        filterMerge.connect(wet);
        input.connect(dry);

        wet.connect(output);
        dry.connect(output);

        lfo.start();

        return {
            type: "autotune",
            nodes: [input, delay, lfo, lfoG, ...filters, filterMerge, wet, dry, output],
            input, output,
        };
    }

    private buildVocoder(ctx: AudioContext, mix: number): EffectChainEntry {
        // Simple vocoder: carrier oscillator modulated by mic envelope
        const input = ctx.createGain();
        const output = ctx.createGain();

        // Carrier: sawtooth oscillator
        const carrier = ctx.createOscillator();
        carrier.type = "sawtooth";
        carrier.frequency.value = 110 + mix * 110;

        const carrierGain = ctx.createGain();
        carrierGain.gain.value = 0;

        // Use multiple band filters for analysis + synthesis
        const bands = 8;
        const nodes: AudioNode[] = [input, output, carrier, carrierGain];

        const mergeGain = ctx.createGain();
        mergeGain.gain.value = 0.5 + mix * 0.5;
        nodes.push(mergeGain);

        for (let i = 0; i < bands; i++) {
            const freq = 200 * Math.pow(2, i * 0.5);
            // Analysis filter (on mic input)
            const analysisBpf = ctx.createBiquadFilter();
            analysisBpf.type = "bandpass";
            analysisBpf.frequency.value = freq;
            analysisBpf.Q.value = 4;

            // Synthesis filter (on carrier)
            const synthBpf = ctx.createBiquadFilter();
            synthBpf.type = "bandpass";
            synthBpf.frequency.value = freq;
            synthBpf.Q.value = 4;

            // Envelope follower approximation — use the analysis signal to modulate carrier band gain
            const bandGain = ctx.createGain();
            bandGain.gain.value = 0;

            input.connect(analysisBpf);
            // Route analysis signal to modulate the band gain
            analysisBpf.connect(bandGain.gain);

            carrier.connect(synthBpf);
            synthBpf.connect(bandGain);
            bandGain.connect(mergeGain);

            nodes.push(analysisBpf, synthBpf, bandGain);
        }

        mergeGain.connect(output);

        // Dry mix
        const dry = ctx.createGain();
        dry.gain.value = 0.3 - mix * 0.2;
        input.connect(dry);
        dry.connect(output);
        nodes.push(dry);

        carrier.start();

        return {
            type: "vocoder",
            nodes,
            input, output,
        };
    }
}
