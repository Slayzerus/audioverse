import {
    AudioSourceProperties,
    AudioSourceType,
    audioSourceTypes,
    AudioType,
    IAudioSourceProperties
} from "./audioSource.ts";

export interface IAudioLayerDetails {
    layerName: string;
    duration: number;
    audioSource: IAudioSourceProperties;
}

export class AudioLayerDetails implements IAudioLayerDetails {
    layerName: string;
    duration: number;
    audioSource: IAudioSourceProperties;

    constructor(layerName: string, duration: number, audioSourceType: AudioSourceType) {
        this.layerName = layerName;
        this.duration = duration;
        // Znajdujemy odpowiedni typ z audioSourceTypes
        const matchingSource = audioSourceTypes.find(source => source.type === audioSourceType);

        if (matchingSource) {
            this.audioSource = new AudioSourceProperties(audioSourceType, "default", matchingSource.audioType);
        }
        else{
            this.audioSource = new AudioSourceProperties(audioSourceType, "default", AudioType.Synth);
        }
    }
}
