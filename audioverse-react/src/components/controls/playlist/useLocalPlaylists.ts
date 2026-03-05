import { useEffect, useMemo, useRef, useState } from "react";
import type { SongDescriptorDto } from "../../../models/modelsPlaylists";
import { loadUserSettings, syncSettingToBackend } from "../../../scripts/settingsSync";

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
    const json = JSON.stringify(data);
    try { localStorage.setItem(KEY, json); } catch { /* Best-effort — no action needed on failure */ }
    syncSettingToBackend({ localPlaylists: json });
}

export function useLocalPlaylists() {
    const [data, setData] = useState<LocalPlaylist[]>(() => load());
    const hydrated = useRef(false);

    // Hydrate from backend once
    useEffect(() => {
        if (hydrated.current) return;
        hydrated.current = true;
        loadUserSettings().then(s => {
            if (s?.localPlaylists) {
                try {
                    const remote = JSON.parse(s.localPlaylists) as LocalPlaylist[];
                    if (Array.isArray(remote) && remote.length > 0) {
                        setData(prev => {
                            // Merge: keep local items, add remote ones not already present
                            const ids = new Set(prev.map(p => p.id));
                            const toAdd = remote.filter(r => !ids.has(r.id));
                            return toAdd.length > 0 ? [...prev, ...toAdd] : prev;
                        });
                    }
                } catch { /* Expected: remote playlist sync may return malformed data */ }
            }
        });
    }, []);

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
