import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from 'react-i18next';
import { AudioLayer } from "../../../models/modelsEditor";
import AudioSourceDetailsComponent from "./AudioSourceDetails";

interface Props {
    layer: AudioLayer;
    onLayerChange: (layer: AudioLayer) => void;
    onSave?: (layer: AudioLayer) => void;
}

const safeParse = (s?: string | null) => {
    try { return s ? JSON.parse(s) : {}; } catch { return {}; }
};

const AudioLayerDetailsComponent: React.FC<Props> = ({ layer, onLayerChange, onSave }) => {
    const { t } = useTranslation();
    const onLayerChangeRef = useRef(onLayerChange);
    onLayerChangeRef.current = onLayerChange;
    const layerRef = useRef(layer);
    layerRef.current = layer;
    const [name, setName] = useState<string>(layer.name ?? "New Layer");
    const [audioSource, setAudioSource] = useState<string>(layer.audioSource ?? "");
    const [params, setParams] = useState<Record<string, unknown>>(safeParse(layer.audioSourceParameters));

    // sync on active layer change
    useEffect(() => {
        setName(layer.name ?? "New Layer");
        setAudioSource(layer.audioSource ?? "");
        setParams(safeParse(layer.audioSourceParameters));
    }, [layer]);

    // push zmian do rodzica
    useEffect(() => {
        onLayerChangeRef.current({
            ...layerRef.current,
            name,
            audioSource,
            audioSourceParameters: JSON.stringify(params),
        });
    }, [name, audioSource, params]);

    return (
        <div className="card p-2 shadow-sm" style={{ maxWidth: 380 }}>
            <h6 className="text-center mb-2">🎵 {t('layerDetails.audioLayer', 'Audio Layer')}</h6>

            <div className="mb-2">
                <label className="form-label" style={{ fontSize: 12 }}>{t('layerDetails.layerName', 'Layer name')}:</label>
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

            {onSave && (
                <button
                    className="btn btn-sm btn-primary mt-3 w-100"
                    onClick={() => onSave({
                        ...layer,
                        name,
                        audioSource,
                        audioSourceParameters: JSON.stringify(params),
                    })}
                >
                    {t('layerDetails.saveLayer', 'Save layer')}
                </button>
            )}
        </div>
    );
};

export default AudioLayerDetailsComponent;
