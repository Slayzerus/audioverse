import axios from "axios";

const API_BASE_URL = "https://api.audioverse.io/api/tools";

interface Voice {
    id: string;
    name: string;
    language: string;
    tts_name: string; // Dodaj brakujące pole
}

/**
 * Pobiera listę dostępnych głosów z API.
 */
export const getVoices = async (): Promise<Voice[]> => {
    try {
        const response = await axios.get<Voice[]>(`${API_BASE_URL}/voices`);
        return response.data;
    } catch (error) {
        console.error("[API] Błąd pobierania głosów:", error);
        return [];
    }
};

/**
 * Pobiera listę dostępnych języków z API
 */
export const getLanguages = async (): Promise<string[]> => {
    try {
        const response = await axios.get(`${API_BASE_URL}/languages`);
        return response.data;
    } catch (error) {
        console.error("[API] Błąd pobierania języków:", error);
        return [];
    }
};

/**
 * Wysyła tekst do API i generuje plik audio.
 * @param text Tekst do syntezowania
 * @param voiceId ID głosu (np. `coqui-tts:en_ljspeech`)
 */
export const generateSpeech = async (text: string, voiceId: string): Promise<Blob | null> => {
    try {
        console.log(`[API] Generowanie mowy: text="${text}", voiceId="${voiceId}"`);

        const response = await axios.post(`${API_BASE_URL}/tts`, null, {
            params: {
                text,
                voice: voiceId,
                format: "wav"
            },
            responseType: "blob"
        });

        return response.data;
    } catch (error) {
        console.error("[API] Błąd generowania mowy:", error);
        return null;
    }
};
