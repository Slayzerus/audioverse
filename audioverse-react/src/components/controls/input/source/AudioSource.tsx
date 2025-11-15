import React, { /*useRef,*/ useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/js/dist/collapse";
/*import { AudioTimelineRef } from "../../editor/AudioTimeline.tsx";*/
import AudioInputSelect from "../settings/AudioInputSelect.tsx";
import { audioSourceTypes, IAudioSourceProperties, AudioSourceType } from "../../../../scripts/audioSource";

const AudioSource: React.FC = () => {
    const [selectedSource, setSelectedSource] = useState<AudioSourceType>(AudioSourceType.Recorder);
    /*const timelineRef = useRef<AudioTimelineRef | null>(null);*/
    const [selectedDevice, setSelectedDevice] = useState<string | null>(null);

    // Pobieranie obiektu wybranego źródła dźwięku
    const selectedAudioSource: IAudioSourceProperties | undefined = audioSourceTypes.find(
        (source) => source.type === selectedSource
    );

    // Obsługa zmiany źródła
    const handleSourceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newType = e.target.value as AudioSourceType;
        setSelectedSource(newType);
    };

    return (
        <div className="container mt-2">
            <div style={{ display: "flex", alignItems: "center" }}>
                <div style={{ marginRight: "10px", fontSize: "12px" }}>Source</div>
                <div className="d-flex justify-content-center align-items-center">
                    <select
                        className="form-select form-select-sm"
                        value={selectedSource}
                        onChange={handleSourceChange}
                        style={{ fontSize: "14px" }}
                    >
                        {audioSourceTypes.map((source) => (
                            <option key={source.type} value={source.type}>
                                {source.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Renderowanie wybranego komponentu */}
            <div className="mt-3">
                {selectedAudioSource && <selectedAudioSource.component />}
            </div>

            <AudioInputSelect selectedDevice={selectedDevice} onDeviceChange={setSelectedDevice} />

            {/* Wyświetlanie właściwości wybranego źródła */}
            {selectedAudioSource && (
                <div className="mt-3 p-2 border rounded">
                    <h6>Audio Source Properties</h6>
                    <p><strong>Name:</strong> {selectedAudioSource.name}</p>
                    <p><strong>Type:</strong> {selectedAudioSource.type}</p>
                    <p><strong>Audio Type:</strong> {selectedAudioSource.audioType}</p>
                    <p><strong>Parameters:</strong> {JSON.stringify(selectedAudioSource.parameters)}</p>
                </div>
            )}
        </div>
    );
};

export default AudioSource;
