import React, { useEffect, useState } from "react";
import { AudioLayer } from "../../../models/modelsEditor";
import AudioSourceDetailsComponent from "./AudioSourceDetails";

interface Props {
    layer: AudioLayer;
    onLayerChange: (layer: AudioLayer) => void;
}

const safeParse = (s?: string | null) => {
    try { return s ? JSON.parse(s) : {}; } catch { return {}; }
};

const AudioLayerDetailsComponent: React.FC<Props> = ({ layer, onLayerChange }) => {
    const [name, setName] = useState<string>(layer.name ?? "New Layer");
    const [audioSource, setAudioSource] = useState<string>(layer.audioSource ?? "");
    const [params, setParams] = useState<Record<string, unknown>>(safeParse(layer.audioSourceParameters));

    // sync przy zmianie aktywnej warstwy
    useEffect(() => {
        setName(layer.name ?? "New Layer");
        setAudioSource(layer.audioSource ?? "");
        setParams(safeParse(layer.audioSourceParameters));
    }, [layer]);

    // push zmian do rodzica
    useEffect(() => {
        onLayerChange({
            ...layer,
            name,
            audioSource,
            audioSourceParameters: JSON.stringify(params),
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [name, audioSource, params]);

    return (
        <div className="card p-2 shadow-sm" style={{ maxWidth: 380 }}>
            <h6 className="text-center mb-2">🎵 Warstwa Audio</h6>

            <div className="mb-2">
                <label className="form-label" style={{ fontSize: 12 }}>Nazwa warstwy:</label>
                <input
                    className="form-control form-control-sm"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
            </div>

            {/* Select + „drugie okno” */}
            <AudioSourceDetailsComponent
                selectedSource={audioSource}
                params={params}
                onSelectSource={(src, defaultParams) => {
                    setAudioSource(src);
                    setParams(defaultParams ?? {});
                }}
                onParamsChange={(next) => setParams(next)}
            />
        </div>
    );
};

export default AudioLayerDetailsComponent;
