import { logger } from "../utils/logger";

const log = logger.scoped('generateSpeech');

export function generateSpeech(
    text: string,
    voiceURI: string,
    rate: number = 1,
    pitch: number = 1,
    volume: number = 1
): Promise<Blob | null> {
    return new Promise((resolve, reject) => {
        if (!window.speechSynthesis) {
            log.error("Web Speech API is not available in this browser!");
            return reject("Web Speech API not supported");
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = rate;
        utterance.pitch = pitch;
        utterance.volume = volume;

        const voices = window.speechSynthesis.getVoices();
        const selectedVoice = voices.find((v) => v.voiceURI === voiceURI);
        if (!selectedVoice) {
            log.error("Voice not found!", { availableVoices: voices });
            return reject("Voice not found");
        }
        utterance.voice = selectedVoice;

        // Create Web Audio API context
        const audioContext = new AudioContext();
        const destination = audioContext.createMediaStreamDestination();
        const mediaRecorder = new MediaRecorder(destination.stream);
        const chunks: BlobPart[] = [];

        mediaRecorder.ondataavailable = (event) => {
            chunks.push(event.data);
        };

        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(chunks, { type: "audio/wav" });
            if (audioBlob.size === 0) {
                log.error("Error: Empty audio file!", { audioBlob });
                return reject("Empty audio file");
            }
            resolve(audioBlob);
        };

        // Create MediaStreamAudioSourceNode for speech synthesizer
        const utteranceSource = audioContext.createMediaStreamSource(destination.stream);
        utteranceSource.connect(audioContext.destination);
        utteranceSource.connect(destination); // Connect stream with MediaRecorder

        mediaRecorder.start();

        utterance.onend = () => {
            setTimeout(() => {
                mediaRecorder.stop();
            }, 500);
        };

        utterance.onerror = (event) => {
            log.error("Speech synthesis error:", event);
            reject("Speech synthesis error");
        };

        window.speechSynthesis.speak(utterance);
    });
}
