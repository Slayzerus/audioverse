import React from "react";
import { useTranslation } from 'react-i18next';
import { audioSourceTypes, AudioSourceType } from "../../../scripts/audioSource";

type Params = Record<string, unknown>;

interface Props {
    selectedSource?: string;
    params: Params;
    onSelectSource: (source: AudioSourceType, defaultParams?: Params) => void;
    onParamsChange: (next: Params) => void;
}

const defaultsFor = (t: AudioSourceType): Params => {
    const def = audioSourceTypes.find(x => x.type === t);
    return def?.parameters ? JSON.parse(JSON.stringify(def.parameters)) : {};
};

const AudioSourceDetailsComponent: React.FC<Props> = ({
                                                          selectedSource,
                                                          params,
                                                          onSelectSource,
                                                          onParamsChange,
                                                      }) => {
    const { t } = useTranslation();
    const current = (selectedSource as AudioSourceType | undefined) ?? audioSourceTypes[0]?.type;

    const def = audioSourceTypes.find((x) => x.type === current);
    const SelectedComp = def?.component;

    // Prepare props for different source components – without optional attributes in JSX.
    const componentProps: Record<string, unknown> = {
        // AudioRecorder.tsx
        onAudioRecorded: (audioBlob: Blob) =>
            onParamsChange({ ...params, audioBlob }),

        // KeyboardPad.tsx
        onAudioGenerated: (audioBuffer: AudioBuffer) =>
            onParamsChange({ ...params, audioBuffer }),

        // AudioClipLibrary.tsx
        onAudioClipSelect: (clip: { id: number; fileName?: string }) =>
            onParamsChange({ ...params, clipId: clip?.id, clipName: clip?.fileName }),

        // SpeechSynth.tsx – if you add such a callback in the component, it will be used;
        // passing an extra prop doesn't break other components.
        onSpeechGenerated: (blob: Blob) =>
            onParamsChange({ ...params, ttsBlob: blob }),
    };

    return (
        <div>
            <div className="d-flex align-items-center gap-2">
                <label style={{fontSize: 12}}>{t('sourceDetails.source', 'Source')}:</label>
                <select
                    className="form-select form-select-sm"
                    value={current}
                    onChange={(e) => {
                        const src = e.target.value as AudioSourceType;
                        onSelectSource(src, defaultsFor(src));
                    }}
                >
                    {audioSourceTypes.map((s) => (
                        <option key={s.type} value={s.type}>
                            {s.name}
                        </option>
                    ))}
                </select>

            </div>

            {/* —— „Drugie okno” —— */}

            <div className="mt-2">
                {SelectedComp ? React.createElement(SelectedComp, componentProps) : null}
            </div>
        </div>
    );
};

export default AudioSourceDetailsComponent;
