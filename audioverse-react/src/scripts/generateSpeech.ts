export function generateSpeech(
    text: string,
    voiceURI: string,
    rate: number = 1,
    pitch: number = 1,
    volume: number = 1
): Promise<Blob | null> {
    return new Promise((resolve, reject) => {
        if (!window.speechSynthesis) {
            console.error("[TTS] Web Speech API nie jest dostępne w tej przeglądarce!");
            return reject("Web Speech API not supported");
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = rate;
        utterance.pitch = pitch;
        utterance.volume = volume;

        const voices = window.speechSynthesis.getVoices();
        const selectedVoice = voices.find((v) => v.voiceURI === voiceURI);
        if (!selectedVoice) {
            console.error("[TTS] Nie znaleziono głosu!", { availableVoices: voices });
            return reject("Voice not found");
        }
        utterance.voice = selectedVoice;

        console.log("[TTS] Rozpoczynam generowanie mowy...");

        // 🔹 Tworzymy Web Audio API
        const audioContext = new AudioContext();
        const destination = audioContext.createMediaStreamDestination();
        const mediaRecorder = new MediaRecorder(destination.stream);
        const chunks: BlobPart[] = [];

        mediaRecorder.ondataavailable = (event) => {
            console.log("[TTS] Otrzymano fragment dźwięku:", event.data);
            chunks.push(event.data);
        };

        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(chunks, { type: "audio/wav" });
            if (audioBlob.size === 0) {
                console.error("[TTS] Błąd: Pusty plik audio!", { audioBlob });
                return reject("Empty audio file");
            }
            console.log("[TTS] Utworzono plik audio:", audioBlob);
            resolve(audioBlob);
        };

        // 🔹 Tworzymy MediaStreamAudioSourceNode dla syntezatora mowy
        const utteranceSource = audioContext.createMediaStreamSource(destination.stream);
        utteranceSource.connect(audioContext.destination);
        utteranceSource.connect(destination); // Połącz strumień z MediaRecorder

        mediaRecorder.start();

        utterance.onend = () => {
            console.log("[TTS] Mowa zakończona, zatrzymuję nagrywanie...");
            setTimeout(() => {
                mediaRecorder.stop();
            }, 500);
        };

        utterance.onerror = (event) => {
            console.error("[TTS] Błąd syntezy mowy:", event);
            reject("Speech synthesis error");
        };

        window.speechSynthesis.speak(utterance);
    });
}
