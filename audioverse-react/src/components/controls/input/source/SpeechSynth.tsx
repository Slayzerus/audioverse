import React, { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { getVoices, generateSpeech, getLanguages } from "../../../../scripts/textToSpeech.ts";
import "bootstrap/dist/css/bootstrap.min.css";
import { logger } from "../../../../utils/logger";
const log = logger.scoped('SpeechSynth');

// Mapa kodów języków na pełne nazwy
const languageMap: Record<string, string> = {
    "en": "English",
    "pl": "Polski",
    "es": "Español",
    "fr": "Français",
    "de": "Deutsch",
    "it": "Italiano",
    "pt": "Português",
    "ru": "Русский",
    "zh": "中文 (Chinese)",
    "ja": "日本語 (Japanese)",
    "ko": "한국어 (Korean)",
    "nl": "Nederlands",
    "ar": "العربية (Arabic)",
    "sv": "Svenska",
    "fi": "Suomi",
    "da": "Dansk",
    "cs": "Čeština",
    "hu": "Magyar",
    "tr": "Türkçe",
    "he": "עברית (Hebrew)",
    "el": "Ελληνικά (Greek)",
    "no": "Norsk",
    "hi": "हिन्दी (Hindi)",
    "id": "Bahasa Indonesia",
    "th": "ไทย (Thai)",
    "ro": "Română",
    "vi": "Tiếng Việt",
    "bg": "Български (Bulgarian)",
    "uk": "Українська (Ukrainian)"
};

const SpeechSynth: React.FC = () => {
    const { t } = useTranslation();
    const [text, setText] = useState<string>("I'm a big boy now or so they say so if you give me 3 I'll be on my way");
    const [voices, setVoices] = useState<{ id: string; name: string; language: string; tts_name: string }[]>([]);
    const [languages, setLanguages] = useState<string[]>([]);
    const [selectedVoice, setSelectedVoice] = useState<string | null>(null);
    const [selectedLanguage, setSelectedLanguage] = useState<string>("All");
    const [selectedTTS, setSelectedTTS] = useState<string>("OpenTTS");
    const [autoPlay, setAutoPlay] = useState<boolean>(true); // ✅ Domyślnie zaznaczony checkbox

    // Fetching languages from API
    useEffect(() => {
        const fetchLanguages = async () => {
            const langs = await getLanguages();
            setLanguages(["All", ...langs]);
        };
        fetchLanguages();
    }, []);

    // Fetching user's default language
    useEffect(() => {
        const getUserLanguage = async () => {
            try {
                const userLang = navigator.language.split("-")[0]; // Getting the language code
                if (Object.keys(languageMap).includes(userLang)) {
                    setSelectedLanguage(userLang);
                }
            } catch (error) {
                log.error("Error fetching user language:", error);
            }
        };
        getUserLanguage();
    }, []);

    // Fetching voice list
    useEffect(() => {
        const fetchVoices = async () => {
            const allVoices = await getVoices();
            const filteredVoices = selectedLanguage === "All"
                ? allVoices
                : allVoices.filter(v => v.language === selectedLanguage);

            setVoices(filteredVoices);
            if (filteredVoices.length > 0) {
                setSelectedVoice(`${filteredVoices[0].tts_name}:${filteredVoices[0].id}`);
            }
        };
        fetchVoices();
    }, [selectedLanguage]);

    const handleSpeak = async () => {
        if (!selectedVoice) return;
        try {
            const audioBlob = await generateSpeech(text, selectedVoice);
            if (audioBlob) {
                const audioUrl = URL.createObjectURL(audioBlob);
                if (autoPlay) new Audio(audioUrl).play();
            }
        } catch (error) {
            log.error("Error generating speech:", error);
        }
    };

    return (
        <div className="container mt-2">
            <div className="card p-2 shadow-sm">
                <h6 className="text-center mb-2">{t('speechSynth.title', 'Speech Synth')}</h6>

                <textarea
                    className="form-control form-control-sm mb-2"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={2}
                    placeholder={t('speechSynth.placeholder', 'Enter text...')}
                    style={{ fontSize: "14px" }}
                />

                <div className="d-flex flex-wrap align-items-center gap-2">
                    <select className="form-select form-select-sm" value={selectedTTS} onChange={(e) => setSelectedTTS(e.target.value)} style={{ fontSize: "12px", width: "15%" }} aria-label={t("speechSynth.engine", "TTS engine")}>
                        <option value="OpenTTS">OpenTTS</option>
                    </select>
                    <select className="form-select form-select-sm" value={selectedLanguage} onChange={(e) => setSelectedLanguage(e.target.value)} style={{ fontSize: "12px", width: "15%" }} aria-label={t("speechSynth.language", "Language")}>
                        <option value="All">All</option>
                        {languages.map(lang => (
                            <option key={lang} value={lang}>
                                {languageMap[lang] || lang}
                            </option>
                        ))}
                    </select>
                    <select className="form-select form-select-sm" value={selectedVoice || ""} onChange={(e) => setSelectedVoice(e.target.value)} style={{ fontSize: "12px", width: "30%" }} aria-label={t("speechSynth.voice", "Voice")}>
                        {voices.map(voice => (
                            <option key={voice.id} value={`${voice.tts_name}:${voice.id}`}>
                                {voice.name} ({languageMap[voice.language] || voice.language})
                            </option>
                        ))}
                    </select>

                    <div className="form-check d-flex align-items-center">
                        <input type="checkbox" className="form-check-input" id="autoPlayCheckbox" checked={autoPlay} onChange={(e) => setAutoPlay(e.target.checked)} />
                        <label className="form-check-label ms-1" htmlFor="autoPlayCheckbox">{t('speechSynth.autoPlay', 'Auto-play')}</label>
                    </div>

                    <div className="ms-auto"> {/* ✅ Alignment to the right */}
                        <button className="btn btn-sm btn-primary px-3" onClick={handleSpeak}>{t('speechSynth.generate', '🎙 Generate')}</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SpeechSynth;
