import axios from "axios";
import { logger } from "../utils/logger";

const log = logger.scoped('textToSpeech');

const API_BASE_URL = "https://api.audioverse.io/api/tools";

interface Voice {
    id: string;
    name: string;
    language: string;
    tts_name: string; // Add missing field
}

/**
 * Fetches the list of available voices from the API.
 */
export const getVoices = async (): Promise<Voice[]> => {
    try {
        const response = await axios.get<Voice[]>(`${API_BASE_URL}/voices`);
        return response.data;
    } catch (error) {
        log.error("Error fetching voices:", error);
        return [];
    }
};

/**
 * Fetches the list of available languages from the API.
 */
export const getLanguages = async (): Promise<string[]> => {
    try {
        const response = await axios.get(`${API_BASE_URL}/languages`);
        return response.data;
    } catch (error) {
        log.error("Error fetching languages:", error);
        return [];
    }
};

/**
 * Sends text to the API and generates an audio file.
 * @param text Text to synthesize
 * @param voiceId Voice ID (e.g. `coqui-tts:en_ljspeech`)
 */
export const generateSpeech = async (text: string, voiceId: string): Promise<Blob | null> => {
    try {

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
        log.error("Error generating speech:", error);
        return null;
    }
};
