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
