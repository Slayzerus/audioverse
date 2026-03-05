import React, { useEffect, useState } from "react";
import { useTranslation } from 'react-i18next';
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/js/dist/collapse";
import styles from "./KeyboardPad.module.css";
import { startAudioContext, playSynth, keyboardLayout, keyMappings, instruments, frequencies, updateEqualizer } from "../../../../scripts/audioKeyboard.ts";

const mechanisms = ["WebAudio", "OpenTTS", "Custom"];
const presets = [...instruments, "Custom"];

export interface KeyboardPadProps {
    onAudioGenerated: (audioBuffer: AudioBuffer) => void;
}

const KeyboardPad: React.FC<KeyboardPadProps> = ({ onAudioGenerated }) => {
    const { t } = useTranslation();
    const [instrument, setInstrument] = useState<string>("Pianino");
    const [mechanism, setMechanism] = useState<string>("WebAudio");
    const [preset, setPreset] = useState<string>("Pianino");
    const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());
    const [isAudioStarted, setIsAudioStarted] = useState(false);
    /*const [equalizer, setEqualizer] = useState<{ [key: string]: number }>({});*/
    const [eqSettings, setEqSettings] = useState<{ [key: string]: number }>(
        Object.keys(frequencies).reduce((acc, note) => {
            acc[note] = 0; // Default zero
            return acc;
        }, {} as { [key: string]: number })
    );

    const handleStartAudio = () => {
        if (startAudioContext()) setIsAudioStarted(true);
    };

    const handleEqChange = (note: string, value: number) => {
        setEqSettings((prev) => ({ ...prev, [note]: value }));
        /*setEqualizer((prev) => ({ ...prev, [note]: value })); // 🔥 Aktualizacja equalizera*/
        updateEqualizer(note, value);
    };


    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (!isAudioStarted) return;
            const note = Object.keys(keyMappings).find(
                (key) => keyMappings[key].keyboard === event.key.toUpperCase()
            );
            if (note) {
                const audioBuffer = playSynth(note, instrument, setActiveKeys);
                if (audioBuffer) onAudioGenerated(audioBuffer); // 🔥 Przekazanie wygenerowanego dźwięku!
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isAudioStarted]);

    return (
        <div className="container mt-2">
            <div className="card p-3 shadow-sm text-center">
                <h6 className="mb-2">🎹 Keyboard Pad</h6>

                {/* 🎛 Mechanizm, preset, instrument */}
                <div className="d-flex justify-content-center align-items-center flex-wrap gap-2">
                    <select
                        className="form-select form-select-sm"
                        value={mechanism}
                        onChange={(e) => setMechanism(e.target.value)}
                        style={{ fontSize: "12px", width: "25%" }}
                        aria-label="Mechanism"
                    >
                        {mechanisms.map((mech) => (
                            <option key={mech} value={mech}>{mech}</option>
                        ))}
                    </select>

                    <select
                        className="form-select form-select-sm"
                        value={preset}
                        onChange={(e) => setPreset(e.target.value)}
                        style={{ fontSize: "12px", width: "25%" }}
                        aria-label="Preset"
                    >
                        {presets.map((preset) => (
                            <option key={preset} value={preset}>{preset}</option>
                        ))}
                    </select>

                    <select
                        className="form-select form-select-sm"
                        value={instrument}
                        onChange={(e) => setInstrument(e.target.value)}
                        style={{ fontSize: "12px", width: "25%" }}
                        disabled={preset !== "Custom"}
                        aria-label="Instrument"
                    >
                        {instruments.map((inst) => (
                            <option key={inst} value={inst}>{inst}</option>
                        ))}
                    </select>
                </div>

                {/* 🔊 Przycisk startu audio */}
                {!isAudioStarted && (
                    <button className="btn btn-sm btn-warning w-100 mt-2" onClick={handleStartAudio}>
                        {t('keyboardPad.enableAudio', '🔊 Click to enable audio')}
                    </button>
                )}

                {/* 🎹 Pianino */}
                <div className={`${styles['piano-container']} mt-2`}>
                    <div className={styles['white-keys']}>
                        {keyboardLayout.map(({ note, type }) => (
                            <div
                                key={note}
                                onClick={() => playSynth(note, instrument, setActiveKeys)}
                                className={`${styles[`${type}-key`]} ${activeKeys.has(note) ? styles['pressed'] : ""}`}
                            >
                                <div className={styles['key-label']}>
                                    <div className={styles['key-label-single']}>{note}</div>
                                    <div className={`${styles['key-label-single']} ${styles['kbd']}`}>{keyMappings[note]?.keyboard || ""}</div>
                                    {keyMappings[note]?.gamepad && (
                                        <div className={`${styles['key-label-single']} gamepad`}>{keyMappings[note]?.gamepad}</div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 🎚 Equalizer - Collapse */}
                <div className={`${styles['eq-container']} mt-3`}>
                    <h6>
                        Equalizer
                        <span className={styles['info-icon']} title={t('keyboardPad.eqTooltip', 'Adjust frequency gain for each note')}>❓</span>
                    </h6>
                    <div className={styles['eq-grid']}>
                        {Object.keys(frequencies).map((note) => (
                            <div key={note} className={styles['eq-column']}>
                                <label>{note}</label>
                                <input
                                    type="range"
                                    min="-10"
                                    max="10"
                                    step="1"
                                    value={eqSettings[note]}
                                    onChange={(e) => handleEqChange(note, parseInt(e.target.value))}
                                    className={styles['eq-slider']}
                                    aria-label={t("keyboardPad.noteEq", "Note EQ level")}
                                />
                                <span className={styles['eq-value']}>{eqSettings[note]}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ⚙️ Ustawienia - Collapse */}
                <div className="mt-3">
                    <button
                        className="btn btn-sm btn-outline-secondary w-100"
                        data-bs-toggle="collapse"
                        data-bs-target="#settingsCollapse"
                    >
                        ⚙ Ustawienia
                    </button>
                    <div className="collapse mt-2 p-2" id="settingsCollapse">
                        <div className="mb-2">
                            <label className="form-label">🎛 Czułość klawiszy</label>
                            <input type="range" className="form-range" min="1" max="10" step="1" aria-label={t("keyboardPad.sensitivity", "Key sensitivity")}/>
                        </div>
                        <div className="mb-2">
                            <label className="form-label">🎼 Głośność</label>
                            <input type="range" className="form-range" min="0" max="100" step="1" aria-label={t("keyboardPad.volume", "Volume")}/>
                        </div>
                        <div className="mb-2">
                            <label className="form-label">⏱ Czas wybrzmiewania</label>
                            <input type="range" className="form-range" min="0.1" max="5" step="0.1" aria-label={t("keyboardPad.sustain", "Sustain time")} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default KeyboardPad;
