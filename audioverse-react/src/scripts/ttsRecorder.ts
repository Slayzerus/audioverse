import { logger } from "../utils/logger";

const log = logger.scoped('ttsRecorder');

class TTSRecorder {
    private synth: SpeechSynthesis;
    private audioContext: AudioContext;
    private mediaRecorder: MediaRecorder | null;
    private chunks: BlobPart[];

    constructor() {
        if (!window.speechSynthesis) {
            throw new Error("Web Speech API nie jest obsługiwane w tej przeglądarce!");
        }

        this.synth = window.speechSynthesis;
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.mediaRecorder = null;
        this.chunks = [];
    }

    private async ensureAudioContext() {
        if (this.audioContext.state === "suspended") {
            await this.audioContext.resume();
        }
    }

    public getVoices(): Promise<SpeechSynthesisVoice[]> {
        return new Promise((resolve) => {
            const voices = this.synth.getVoices();
            if (voices.length) {
                resolve(voices);
            } else {
                this.synth.onvoiceschanged = () => {
                    resolve(this.synth.getVoices());
                };
            }
        });
    }

    public async speak(
        text: string,
        voiceURI: string | null = null,
        rate: number = 1,
        pitch: number = 1,
        volume: number = 1
    ): Promise<Blob> {
        await this.ensureAudioContext();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = rate;
        utterance.pitch = pitch;
        utterance.volume = volume;

        const voices = await this.getVoices();
        if (voiceURI) {
            const selectedVoice = voices.find((v) => v.voiceURI === voiceURI);
            if (selectedVoice) {
                utterance.voice = selectedVoice;
            } else {
                log.error("Voice not found!");
                throw new Error("Voice not found!");
            }
        }

        // 🔹 Creating MediaStreamDestination to capture audio
        const destination = this.audioContext.createMediaStreamDestination();
        const mediaRecorder = new MediaRecorder(destination.stream);
        this.mediaRecorder = mediaRecorder;
        this.chunks = [];

        return new Promise((resolve) => {
            mediaRecorder.ondataavailable = (event) => {
                this.chunks.push(event.data);
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(this.chunks, { type: "audio/wav" });
                resolve(blob);
            };

            // 🔹 Connecting speech synthesizer to Web Audio API
            const utteranceSource = this.audioContext.createMediaStreamSource(destination.stream);
            utteranceSource.connect(this.audioContext.destination);
            utteranceSource.connect(destination); // Capturing audio to MediaRecorder
            mediaRecorder.start();
            this.synth.speak(utterance);

            utterance.onend = () => {
                setTimeout(() => {
                    this.mediaRecorder?.stop();
                }, 500);
            };
        });
    }

    public async saveAudio(blob: Blob, filename: string = "speech.wav"): Promise<void> {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

export default TTSRecorder;
