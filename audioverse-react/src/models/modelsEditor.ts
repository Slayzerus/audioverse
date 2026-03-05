export interface AudioProject {
    id: number;
    name: string;
    userProfileId: number;
    isTemplate?: boolean;
    volume?: number;
    sections?: AudioSection[];
}

export interface AudioSection {
    id: number;
    projectId: number;
    name: string;
    orderNumber: number;
    duration?: string; // np. "00:03:30" lub ISO 8601
    bpm?: number;
    layers?: AudioLayer[];
}

export interface AudioLayer {
    id: number;
    sectionId: number;
    name: string;
    audioSource: string;
    audioSourceParameters: string;
    audioClipId?: number;
    duration?: string; // np. "00:01:00"
    bpm?: number;
    volume?: number;
    items?: AudioLayerItem[];
}

export interface AudioLayerItem {
    id: number;
    layerId: number;
    startTime: string; // ISO 8601 format
    parameters: string;
}

export interface AudioClip {
    id: number;
    userProfileId?: number;
    fileName: string;
    fileFormat: string;
    data: Uint8Array;
    duration: string;
    size: number;
    tags?: string[];
}

export interface AudioInputPreset {
    id: number;
    version: string;
    userProfileId?: number;
    name: string;
}

// ── Audio Effects ──

export enum AudioEffectType {
    Equalizer = 0,
    Compressor = 1,
    Reverb = 2,
    Delay = 3,
    Distortion = 4,
    Chorus = 5,
    Flanger = 6,
    Phaser = 7,
}

export interface AudioEffect {
    id: number;
    name?: string | null;
    type: AudioEffectType;
    parametersJson?: string | null;
}

export interface AudioLayerEffect {
    id: number;
    layerId: number;
    layer?: AudioLayer | null;
    effectId: number;
    effect?: AudioEffect | null;
    order: number;
    paramsOverrideJson?: string | null;
}

// ── Collaborators ──

export enum CollaboratorPermission {
    ReadOnly = 0,
    Edit = 1,
    Owner = 2,
}

export interface AudioProjectCollaborator {
    id: number;
    projectId: number;
    project?: AudioProject | null;
    userId: number;
    permission: CollaboratorPermission;
    joinedAt: string;
}

// ── Sample Packs ──

export interface AudioSamplePack {
    id: number;
    name?: string | null;
    description?: string | null;
    genre?: string | null;
    instrument?: string | null;
    bpm?: number | null;
    createdByUserId?: number | null;
    createdAt: string;
    samples?: AudioSample[] | null;
}

export interface AudioSample {
    id: number;
    packId: number;
    pack?: AudioSamplePack | null;
    name?: string | null;
    objectKey?: string | null;
    mimeType?: string | null;
    durationMs?: number | null;
    bpm?: number | null;
    key?: string | null;
}
