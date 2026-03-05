export interface RecorderStartOptions {
    deviceId?: string;
    mimeType?: string;
    onLevel?: (level: number) => void;
    /** Mic gain multiplier (0–3). 0 = no gain node, 1 = unity. */
    gain?: number;
    /** Route mic audio to speakers (monitor / odsłuch). */
    monitorEnabled?: boolean;
    /** Monitor volume 0–100 (applied as 0–1 gain on monitor path). */
    monitorVolume?: number;
}

/**
 * Simplified single-input recorder with level monitoring.
 */
export class AudioRecorder {
    private stream: MediaStream | null = null;
    private mediaRecorder: MediaRecorder | null = null;
    private audioChunks: Blob[] = [];
    private isRecording = false;
    private audioContext: AudioContext | null = null;
    private analyser: AnalyserNode | null = null;
    private gainNode: GainNode | null = null;
    private monitorGain: GainNode | null = null;
    private levelRaf: number | null = null;
    private levelCallback?: (level: number) => void;

    async startRecording(options: RecorderStartOptions = {}) {
        if (this.isRecording) return;

        this.levelCallback = options.onLevel;
        this.stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                deviceId: options.deviceId || undefined,
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: false,
            },
        });

        const mimeType = options.mimeType || "audio/webm";
        this.mediaRecorder = new MediaRecorder(this.stream, { mimeType });
        this.audioChunks = [];

        // Level monitoring
        this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        const source = this.audioContext.createMediaStreamSource(this.stream);

        // Gain node (mic gain / wzmocnienie)
        let lastNode: AudioNode = source;
        if (options.gain !== undefined && options.gain > 0) {
            this.gainNode = this.audioContext.createGain();
            this.gainNode.gain.value = options.gain;
            lastNode.connect(this.gainNode);
            lastNode = this.gainNode;
        }

        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 2048;
        lastNode.connect(this.analyser);

        // Monitor (odsłuch) — route to speakers if enabled
        if (options.monitorEnabled) {
            this.monitorGain = this.audioContext.createGain();
            this.monitorGain.gain.value = (options.monitorVolume ?? 100) / 100;
            lastNode.connect(this.monitorGain);
            this.monitorGain.connect(this.audioContext.destination);
        }

        const monitorLevel = () => {
            if (!this.analyser) return;
            const data = new Uint8Array(this.analyser.fftSize);
            this.analyser.getByteTimeDomainData(data);
            let sum = 0;
            for (let i = 0; i < data.length; i++) {
                const v = (data[i] - 128) / 128;
                sum += v * v;
            }
            const rms = Math.sqrt(sum / data.length);
            if (this.levelCallback) {
                this.levelCallback(rms);
            }
            if (this.isRecording) {
                this.levelRaf = requestAnimationFrame(monitorLevel);
            }
        };

        this.mediaRecorder.ondataavailable = (event) => {
            if (event.data && event.data.size > 0) {
                this.audioChunks.push(event.data);
            }
        };

        this.mediaRecorder.start();
        this.isRecording = true;
        this.levelRaf = requestAnimationFrame(monitorLevel);
    }

    getStream(): MediaStream | null {
        return this.stream;
    }

    async stopRecording(): Promise<Blob | null> {
        if (!this.isRecording || !this.mediaRecorder) return null;

        return new Promise<Blob | null>((resolve) => {
            const recorder = this.mediaRecorder!;
            recorder.onstop = () => {
                const blob = new Blob(this.audioChunks, { type: recorder.mimeType });
                this.cleanup();
                resolve(blob);
            };
            recorder.stop();
            this.isRecording = false;
        });
    }

    private cleanup() {
        if (this.levelRaf) {
            cancelAnimationFrame(this.levelRaf);
            this.levelRaf = null;
        }
        this.levelCallback = undefined;
        if (this.monitorGain) {
            this.monitorGain.disconnect();
            this.monitorGain = null;
        }
        if (this.gainNode) {
            this.gainNode.disconnect();
            this.gainNode = null;
        }
        if (this.analyser) {
            this.analyser.disconnect();
            this.analyser = null;
        }
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        if (this.stream) {
            this.stream.getTracks().forEach((t) => t.stop());
            this.stream = null;
        }
        this.mediaRecorder = null;
        this.audioChunks = [];
    }
}
