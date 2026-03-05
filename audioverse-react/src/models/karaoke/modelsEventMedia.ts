// modelsEventMedia.ts — Modele dla kolekcji, kolaży, tagów eventowych

export interface EventMediaCollection {
    id: number;
    eventId: number;
    name: string;
    description?: string | null;
    createdAt: string;
    coverPhotoId?: number | null;
    coverVideoId?: number | null;
}

export interface EventCollage {
    id: number;
    eventId: number;
    name: string;
    description?: string | null;
    createdAt: string;
    items: EventCollageItem[];
}

export interface EventCollageItem {
    id: number;
    collageId: number;
    photoId?: number;
    videoId?: number;
    x: number;
    y: number;
    z: number;
    width: number;
    height: number;
    rotation: number;
    filtersJson?: string | null;
}

export interface EventMediaTag {
    id: number;
    photoId?: number | null;
    videoId?: number | null;
    contactId?: number | null;
    userId?: number | null;
    label?: string | null;
    x: number; // 0.0–1.0
    y: number; // 0.0–1.0
    width?: number | null;
    height?: number | null;
    timestampSeconds?: number | null; // dla wideo — pozycja w sekundach
    taggedByUserId?: number | null;
    createdAt?: string;
}
