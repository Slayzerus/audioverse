import { useEffect, useMemo, useState } from "react";
import type { SongDescriptorDto } from "../../../models/modelsPlaylists";

export type LocalPlaylist = {
    id: string;
    name: string;
    items: SongDescriptorDto[];
    updatedAt: string; // ISO
};

const KEY = "av:local-playlists";

function load(): LocalPlaylist[] {
    try {
        const raw = localStorage.getItem(KEY);
        return raw ? (JSON.parse(raw) as LocalPlaylist[]) : [];
    } catch {
        return [];
    }
}
function save(data: LocalPlaylist[]) {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch {}
}

export function useLocalPlaylists() {
    const [data, setData] = useState<LocalPlaylist[]>(() => load());

    useEffect(() => { save(data); }, [data]);

    const api = useMemo(() => ({
        list: () => data,
        get: (id: string) => data.find(p => p.id === id),
        create: (name: string) => {
            const now = new Date().toISOString();
            const pl: LocalPlaylist = { id: crypto.randomUUID(), name, items: [], updatedAt: now };
            setData(prev => [pl, ...prev]);
            return pl;
        },
        rename: (id: string, name: string) => setData(prev => prev.map(p => p.id === id ? { ...p, name, updatedAt: new Date().toISOString() } : p)),
        remove: (id: string) => setData(prev => prev.filter(p => p.id !== id)),
        replaceItems: (id: string, items: SongDescriptorDto[]) => setData(prev => prev.map(p => p.id === id ? { ...p, items, updatedAt: new Date().toISOString() } : p)),
        addItems: (id: string, items: SongDescriptorDto[]) => setData(prev => prev.map(p => p.id === id ? { ...p, items: [...p.items, ...items], updatedAt: new Date().toISOString() } : p)),
    }), [data]);

    return api;
}
