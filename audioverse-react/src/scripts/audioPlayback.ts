export interface SoundEvent {
    time: number;
    duration: number;
    buffer?: AudioBuffer;
    played: boolean;
}

export interface AudioLayer {
    id: number;
    name: string;
    sounds: SoundEvent[];
}

export class AudioPlayback {
    private audioContext: AudioContext | null = null;
    private animationRef: number | null = null;
    private isLooping: boolean = false;
    private isRecording: boolean = false;
    private currentTime: number = 0;
    private layers: AudioLayer[] = [];
    private TOTAL_DURATION = 10;

    constructor() {
        this.audioContext = new AudioContext();
    }

    public playAudio(): void {
        if (!this.audioContext || this.layers.length === 0) return;

        this.isRecording = false;
        this.audioContext.resume();
        this.startTimeline();
    }

    public stopAudio(): void {
        this.isRecording = false;
        this.currentTime = 0;
        if (this.animationRef) cancelAnimationFrame(this.animationRef);
    }

    public toggleLoop(): void {
        this.isLooping = !this.isLooping;
    }

    public toggleRecording(): void {
        this.isRecording = !this.isRecording;
        if (this.isRecording) {
            this.startTimeline();
        } else {
            if (this.animationRef) cancelAnimationFrame(this.animationRef);
        }
    }

    public addLayer(): void {
        this.layers.push({ id: this.layers.length, name: `Warstwa ${this.layers.length + 1}`, sounds: [] });
    }

    public addSoundToLayer(buffer: AudioBuffer, activeLayer: number): void {
        if (!this.isRecording) return;

        this.layers = this.layers.map(layer =>
            layer.id === activeLayer
                ? {
                    ...layer,
                    sounds: [...layer.sounds, { time: this.currentTime, duration: buffer.duration, buffer, played: false }]
                }
                : layer
        );
    }

    private startTimeline(): void {
        const update = () => {
            this.currentTime += 0.05;
            if (this.currentTime >= this.TOTAL_DURATION) {
                if (this.isLooping) {
                    this.currentTime = 0;
                } else {
                    this.stopAudio();
                    return;
                }
            }

            this.checkAndPlaySounds();
            this.animationRef = requestAnimationFrame(update);
        };

        this.animationRef = requestAnimationFrame(update);
    }

    private checkAndPlaySounds(): void {
        this.layers.forEach(layer => {
            layer.sounds.forEach(sound => {
                if (this.currentTime >= sound.time && this.currentTime < sound.time + sound.duration && !sound.played) {
                    this.playSound(sound);
                    sound.played = true;
                }
            });
        });
    }

    private playSound(sound: SoundEvent): void {
        if (!this.audioContext || !sound.buffer) return;

        const source = this.audioContext.createBufferSource();
        source.buffer = sound.buffer;

        const gainNode = this.audioContext.createGain();
        gainNode.gain.value = 1;

        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        source.start(0);
    }
}
