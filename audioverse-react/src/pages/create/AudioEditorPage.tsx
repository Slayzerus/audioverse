import React, { useState } from "react";
import { useTranslation } from 'react-i18next';
import AudioEditor from "../../components/controls/editor/AudioEditor.tsx";
import MidiSeedDemo from "../../components/editor/MidiSeedDemo";
import type { SeedResult } from "../../scripts/midi/midiSeedGenerator";

const AudioEditorPage: React.FC = () => {
    const { t } = useTranslation();
    const [showSeed, setShowSeed] = useState(false);

    const handleSeedImport = (seed: SeedResult) => {
        // Future: push seed layers into AudioEditor state via context/props
        // For now store in sessionStorage so editor can pick it up
        sessionStorage.setItem("midiSeed", JSON.stringify(seed));
        setShowSeed(false);
        window.dispatchEvent(new CustomEvent("midiSeedImport", { detail: seed }));
    };

    return (
        <div>
            <div style={{ textAlign: "center", width: "100%", backgroundColor: "black", color: "white", display: "flex", justifyContent: "center", alignItems: "center", gap: 12, padding: "4px 0" }}>
                <span>{t('audioEditor.title', 'Verse Editor v0.01')}</span>
                <button
                    onClick={() => setShowSeed(s => !s)}
                    style={{ background: showSeed ? "#7c4dff" : "#333", border: "1px solid #555", color: "#fff", borderRadius: 6, padding: "2px 10px", fontSize: 13, cursor: "pointer" }}
                >
                    🎼 MIDI Seed
                </button>
            </div>
            {showSeed && (
                <div style={{ padding: "12px 16px", background: "#111" }}>
                    <MidiSeedDemo onImport={handleSeedImport} />
                </div>
            )}
            <AudioEditor />
        </div>
    );
};

export default AudioEditorPage;
