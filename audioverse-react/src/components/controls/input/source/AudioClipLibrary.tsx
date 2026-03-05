import React, { useState } from "react";
import { useTranslation } from 'react-i18next';
import AudioClipUploadForm from "../../../forms/editor/AudioClipUploadForm.tsx";
import AudioClipList from "../../../lists/AudioClipList";
import { AudioClip } from "../../../../models/modelsEditor.ts";

interface Props {
    onAudioClipSelect?: (clip: AudioClip) => void;
}

const AudioClipLibrary: React.FC<Props> = ({ onAudioClipSelect }) => {
    const { t } = useTranslation();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedClip, setSelectedClip] = useState<AudioClip | null>(null);

    const openModal = () => setIsModalOpen(true);
    const closeModal = () => setIsModalOpen(false);

    const handleClipSelect = (clip: AudioClip) => {
        setSelectedClip(clip);
        if (onAudioClipSelect) {
            onAudioClipSelect(clip);
        }
    };

    return (
        <div style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column"
        }}>
            <h1>{t('clipLibrary.title', 'AudioClip Library')}</h1>
            <button onClick={openModal} style={{
                padding: "10px 20px",
                fontSize: "16px",
                cursor: "pointer",
                marginBottom: "20px"
            }}>
                🎵 {t('clipLibrary.addClip', 'Add AudioClip')}
            </button>

            <AudioClipList onSelect={handleClipSelect} />

            {/* Modal dla formularza uploadu */}
            {isModalOpen && (
                <div role="dialog" aria-modal="true" aria-labelledby="audioclip-upload-title" style={{
                    position: "fixed",
                    top: 0, left: 0,
                    width: "100%", height: "100%",
                    backgroundColor: "rgba(0, 0, 0, 0.5)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                }}>
                    <div style={{
                        backgroundColor: "white",
                        padding: "20px",
                        borderRadius: "8px",
                        width: "90vw",
                        maxWidth: "400px",
                        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.3)"
                    }}>
                        <h2 id="audioclip-upload-title">{t('clipLibrary.addNew', 'Add New AudioClip')}</h2>
                        <AudioClipUploadForm />
                        <button onClick={closeModal} style={{
                            marginTop: "10px",
                            padding: "8px 12px",
                            backgroundColor: "red",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer"
                        }}>
                            ❌ {t('clipLibrary.close', 'Close')}
                        </button>
                    </div>
                </div>
            )}

            {selectedClip && (
                <p style={{ marginTop: "20px", fontWeight: "bold" }}>
                    Wybrano: {selectedClip.fileName}
                </p>
            )}
        </div>
    );
};

export default AudioClipLibrary;
