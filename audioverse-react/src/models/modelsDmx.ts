// ==== DTO z /api/dmx/state ====
export interface DmxStateDto {
    fps: number;            // 10..44
    startCode: number;      // 0..255
    frontSnapshot: number[]; // 513 numbers (0=start code, 1..512 channels)
}

// ==== Channel type enum (compatible with backend) ====
export enum DmxChannelType {
    Unknown = "Unknown",
    Dimmer = "Dimmer",
    DimmerWithOff = "DimmerWithOff",
    RotationWithOff = "RotationWithOff",
    RotationWithOffAndCcw = "RotationWithOffAndCcw",
    Options = "Options",
}

// ==== Channel segment (value range) ====
export interface DmxChannelSegment {
    valueFrom: number; // 0..255
    valueTo: number;   // 0..255
    name: string;
    notes?: string;
    isOff?: boolean;
}

// ==== Single channel description ====
export interface DmxDeviceChannelInfo {
    channel: number;          // 1..512
    name: string;
    group?: string;
    type: DmxChannelType;
    segments: DmxChannelSegment[];
    defaultValue?: number;
    inverted?: boolean;
}

// ==== Opis fixture’a ====
export interface DmxDeviceInfo {
    manufacturer: string;
    model: string;
    version?: string | null;
    modeName: string;     // np. "17ch"
    footprint: number;    // number of channels
    channels: DmxDeviceChannelInfo[];
}

// ==== DTO z /api/dmx/devices (rozszerzone o DmxDeviceInfo) ====
export interface FtdiDeviceDto {
    serialNumber: string;
    description: string;
    locId: number;
    deviceInfo: DmxDeviceInfo; // provided by your handler
}

// ── DMX Scenes ──

export interface DmxScene {
    id: number;
    name?: string | null;
    description?: string | null;
    channelValuesJson?: string | null;
    durationMs?: number | null;
    createdAt: string;
}

export interface DmxSceneStep {
    id: number;
    sequenceId: number;
    sceneId: number;
    scene?: DmxScene | null;
    order: number;
    holdMs: number;
    fadeMs: number;
}

export interface DmxSceneSequence {
    id: number;
    name?: string | null;
    loop: boolean;
    steps?: DmxSceneStep[] | null;
}

export interface BeatReactiveRequest {
    bpm: number;
    sceneId?: number | null;
    beats: number;
}

export interface BeatTapRequest {
    sceneId?: number | null;
}