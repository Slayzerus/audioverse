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
            console.log("[TTS] AudioContext jest wstrzymany, wznawiam...");
            await this.audioContext.resume();
            console.log("[TTS] AudioContext wznowiony.");
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
        return new Promise(async (resolve, reject) => {
            console.log("[TTS] Rozpoczynam syntezę mowy:", { text, voiceURI, rate, pitch, volume });

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
                    console.log("[TTS] Wybrano głos:", selectedVoice.name);
                } else {
                    console.error("[TTS] Nie znaleziono głosu!");
                    return reject(new Error("Nie znaleziono głosu!"));
                }
            }

            // 🔹 Tworzymy MediaStreamDestination do przechwycenia dźwięku
            const destination = this.audioContext.createMediaStreamDestination();
            this.mediaRecorder = new MediaRecorder(destination.stream);
            this.chunks = [];

            this.mediaRecorder.ondataavailable = (event) => {
                console.log("[TTS] Otrzymano fragment dźwięku:", event.data);
                this.chunks.push(event.data);
            };

            this.mediaRecorder.onstop = () => {
                const blob = new Blob(this.chunks, { type: "audio/wav" });
                console.log("[TTS] Plik audio utworzony:", blob);
                resolve(blob);
            };

            // 🔹 Podłączamy syntezator mowy do Web Audio API
            const utteranceSource = this.audioContext.createMediaStreamSource(destination.stream);
            utteranceSource.connect(this.audioContext.destination);
            utteranceSource.connect(destination); // Przechwycenie dźwięku do MediaRecorder

            console.log("[TTS] Rozpoczynam nagrywanie...");
            this.mediaRecorder.start();
            this.synth.speak(utterance);

            utterance.onend = () => {
                console.log("[TTS] Mowa zakończona, zatrzymuję nagrywanie...");
                setTimeout(() => {
                    this.mediaRecorder?.stop();
                }, 500);
            };
        });
    }

    public async saveAudio(blob: Blob, filename: string = "speech.wav"): Promise<void> {
        console.log("[TTS] Zapisuję plik audio:", filename);
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
