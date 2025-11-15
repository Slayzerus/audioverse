/// <reference types="react" />

import AudioClipLibrary from "../components/controls/input/source/AudioClipLibrary";
import AudioRecorder from "../components/controls/input/source/AudioRecorder";
import KeyboardPad from "../components/controls/input/source/KeyboardPad";
import SpeechSynth from "../components/controls/input/source/SpeechSynth";

/// <summary>
/// Describes available audio categories for sources (instrument role).
/// </summary>
export enum AudioType {
    /// <summary>Instrumental part.</summary>
    Instrumental = "instrumental",
    /// <summary>Vocal part.</summary>
    Vocal = "vocal",
    /// <summary>Drums/percussion.</summary>
    Drums = "drums",
    /// <summary>String instruments.</summary>
    Strings = "strings",
    /// <summary>Synthesizer.</summary>
    Synth = "synth",
    /// <summary>Ambient/background.</summary>
    Ambient = "ambient",
    /// <summary>FX and one-shots.</summary>
    Effect = "effect",
}

/// <summary>
/// Enumerates UI-selectable audio source kinds.
/// Includes legacy and compact labels for backward compatibility.
/// </summary>
export enum AudioSourceType {
    /// <summary>Microphone / live recorder.</summary>
    Recorder = "Recorder",

    /// <summary>Library clip (legacy spaced label).</summary>
    AudioClip = "Audio Clip",

    /// <summary>Text-to-speech generator.</summary>
    SpeechSynth = "Speech Synth",

    /// <summary>Streaming source (placeholder).</summary>
    Stream = "Stream",

    /// <summary>On-screen keyboard/pads (legacy label).</summary>
    KeyboardPad = "Keyboard/Pads",

    /// <summary>On-screen keyboard (new compact label).</summary>
    Keyboard = "Keyboard",

    /// <summary>Library clip (new compact label).</summary>
    AudioClipCompact = "AudioClip",
}

/// <summary>
/// Describes a single audio source entry for UI registry.
/// </summary>
export interface IAudioSourceProperties {
    /// <summary>Display name.</summary>
    name: string;
    /// <summary>Source type discriminator.</summary>
    type: AudioSourceType;
    /// <summary>React component used to render source controls.</summary>
    component: React.ComponentType<any>;
    /// <summary>High-level audio role.</summary>
    audioType: AudioType;
    /// <summary>Arbitrary parameter bag for initial config.</summary>
    parameters: Record<string, unknown>;
}

/// <summary>
/// Backward/forward compatibility alias to match newer imports.
/// </summary>
export type IAudioSourceDescriptor = IAudioSourceProperties;

/// <summary>
/// Registry of components keyed by source type string.
/// Supports both legacy and compact labels.
/// </summary>
const AudioSourceComponentRegistry: Record<string, React.ComponentType<any>> = {
    // Recorder
    [AudioSourceType.Recorder]: AudioRecorder,

    // Keyboard / Pads (both labels)
    [AudioSourceType.KeyboardPad]: KeyboardPad,
    [AudioSourceType.Keyboard]: KeyboardPad,

    // Speech Synth
    [AudioSourceType.SpeechSynth]: SpeechSynth,

    // Audio Clip (both labels)
    [AudioSourceType.AudioClip]: AudioClipLibrary,
    [AudioSourceType.AudioClipCompact]: AudioClipLibrary,

    // Stream (placeholder reuse – adjust when Stream component exists)
    [AudioSourceType.Stream]: SpeechSynth,
};

/// <summary>
/// Concrete audio source model used to build the selectable list.
/// </summary>
export class AudioSourceProperties implements IAudioSourceProperties {
    /// <summary>Display name.</summary>
    public name: string;
    /// <summary>Source type discriminator.</summary>
    public type: AudioSourceType;
    /// <summary>React component used to render source controls.</summary>
    public component: React.ComponentType<any>;
    /// <summary>High-level audio role.</summary>
    public audioType: AudioType;
    /// <summary>Initial parameters.</summary>
    public parameters: Record<string, unknown>;

    /// <summary>
    /// Creates an audio source descriptor.
    /// </summary>
    /// <param name="type">Source type discriminator.</param>
    /// <param name="name">Display name.</param>
    /// <param name="audioType">High-level audio role.</param>
    /// <param name="parameters">Initial parameter bag.</param>
    constructor(
        type: AudioSourceType,
        name: string,
        audioType: AudioType,
        parameters: Record<string, unknown> = {}
    ) {
        this.type = type;
        this.name = name;
        this.component = AudioSourceComponentRegistry[type] ?? (() => null);
        this.audioType = audioType;
        this.parameters = parameters;
    }
}

/// <summary>
/// Default list of selectable audio sources for the editor.
/// Includes legacy and compact variants where useful.
/// </summary>
export const audioSourceTypes: AudioSourceProperties[] = [
    new AudioSourceProperties(AudioSourceType.Recorder, "Recorder", AudioType.Vocal, {
        deviceId: "",
        gain: 1,
        sensitivity: "high",
    }),
    // Library clip (prefer compact label internally while keeping legacy string available)
    new AudioSourceProperties(AudioSourceType.AudioClip, "Audio Clip", AudioType.Instrumental, {
        clipId: null as number | null,
        octave: "4",
    }),
    new AudioSourceProperties(AudioSourceType.SpeechSynth, "Speech Synth", AudioType.Vocal, {
        text: "",
        voice: "default",
    }),
    new AudioSourceProperties(AudioSourceType.KeyboardPad, "Keyboard", AudioType.Instrumental, {
        instrument: "piano",
        preset: "default",
        velocity: 100,
    }),
];
