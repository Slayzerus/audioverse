import React, { useState, useEffect } from "react";
import { getVoices, generateSpeech, getLanguages } from "../../../../scripts/textToSpeech.ts";
import "bootstrap/dist/css/bootstrap.min.css";

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
    const [text, setText] = useState<string>("I'm a big boy now or so they say so if you give me 3 I'll be on my way");
    const [voices, setVoices] = useState<{ id: string; name: string; language: string; tts_name: string }[]>([]);
    const [languages, setLanguages] = useState<string[]>([]);
    const [selectedVoice, setSelectedVoice] = useState<string | null>(null);
    const [selectedLanguage, setSelectedLanguage] = useState<string>("All");
    const [selectedTTS, setSelectedTTS] = useState<string>("OpenTTS");
    const [autoPlay, setAutoPlay] = useState<boolean>(true); // ✅ Domyślnie zaznaczony checkbox

    // Pobieranie języków z API
    useEffect(() => {
        const fetchLanguages = async () => {
            const langs = await getLanguages();
            setLanguages(["All", ...langs]);
        };
        fetchLanguages();
    }, []);

    // Pobieranie domyślnego języka użytkownika
    useEffect(() => {
        const getUserLanguage = async () => {
            try {
                const userLang = navigator.language.split("-")[0]; // Pobranie kodu języka
                if (Object.keys(languageMap).includes(userLang)) {
                    setSelectedLanguage(userLang);
                }
            } catch (error) {
                console.error("Błąd pobierania języka użytkownika:", error);
            }
        };
        getUserLanguage();
    }, []);

    // Pobieranie listy głosów
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
            console.log(`[UI] Generowanie mowy: text="${text}", voice="${selectedVoice}"`);
            const audioBlob = await generateSpeech(text, selectedVoice);
            if (audioBlob) {
                const audioUrl = URL.createObjectURL(audioBlob);
                if (autoPlay) new Audio(audioUrl).play();
            }
        } catch (error) {
            console.error("[UI] Błąd generowania mowy:", error);
        }
    };

    return (
        <div className="container mt-2">
            <div className="card p-2 shadow-sm">
                <h6 className="text-center mb-2">Speech Synth</h6> {/* ✅ Zmieniona nazwa */}

                <textarea
                    className="form-control form-control-sm mb-2"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={2}
                    placeholder="Wpisz tekst..."
                    style={{ fontSize: "14px" }}
                />

                <div className="d-flex flex-wrap align-items-center gap-2">
                    <select className="form-select form-select-sm" value={selectedTTS} onChange={(e) => setSelectedTTS(e.target.value)} style={{ fontSize: "12px", width: "15%" }}>
                        <option value="OpenTTS">OpenTTS</option>
                    </select>
                    <select className="form-select form-select-sm" value={selectedLanguage} onChange={(e) => setSelectedLanguage(e.target.value)} style={{ fontSize: "12px", width: "15%" }}>
                        <option value="All">All</option>
                        {languages.map(lang => (
                            <option key={lang} value={lang}>
                                {languageMap[lang] || lang}
                            </option>
                        ))}
                    </select>
                    <select className="form-select form-select-sm" value={selectedVoice || ""} onChange={(e) => setSelectedVoice(e.target.value)} style={{ fontSize: "12px", width: "30%" }}>
                        {voices.map(voice => (
                            <option key={voice.id} value={`${voice.tts_name}:${voice.id}`}>
                                {voice.name} ({languageMap[voice.language] || voice.language})
                            </option>
                        ))}
                    </select>

                    <div className="form-check d-flex align-items-center">
                        <input type="checkbox" className="form-check-input" id="autoPlayCheckbox" checked={autoPlay} onChange={(e) => setAutoPlay(e.target.checked)} />
                        <label className="form-check-label ms-1" htmlFor="autoPlayCheckbox">Odtwarzaj</label>
                    </div>

                    <div className="ms-auto"> {/* ✅ Wyrównanie do prawej */}
                        <button className="btn btn-sm btn-primary px-3" onClick={handleSpeak}>🎙 Generate</button> {/* ✅ Zmieniony opis */}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SpeechSynth;
