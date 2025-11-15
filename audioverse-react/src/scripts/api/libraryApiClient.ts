import axios from "axios";

/**
 * Jedno źródło prawdy dla hosta Library API.
 * Priorytet: Vite env -> CRA env -> window global -> domyślny.
 */
/*const DEFAULT_LIBRARY_API_ROOT = "https://libraryapi.audioverse.io";*/
const DEFAULT_LIBRARY_API_ROOT = "https://localhost:44305";
axios.defaults.withCredentials = true;

// Vite
const fromVite = (() => {
    try {
        return (import.meta as any)?.env?.VITE_LIBRARY_API_ROOT as string | undefined;
    } catch {
        return undefined;
    }
})();

// CRA
const fromCra = (globalThis as any)?.process?.env?.REACT_APP_LIBRARY_API_ROOT as
    | string
    | undefined;

// window override
const fromWindow = (globalThis as any)?.__LIBRARY_API_ROOT__ as string | undefined;

export const API_ROOT: string =
    fromVite || fromCra || fromWindow || DEFAULT_LIBRARY_API_ROOT;

// Główny klient axios (z JSON)
export const apiClient = axios.create({
    baseURL: API_ROOT,
    headers: { "Content-Type": "application/json" },
    withCredentials: true, // cookies/sesja
});

// Helper do budowy ścieżek modułów
export const apiPath = (moduleBase: string, path: string) =>
    `${moduleBase.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;

// Bazy modułów Library API
export const AUTH_BASE = "/api/auth";
export const PLAYLIST_BASE = "/api/playlist";
export const LIBRARY_BASE = "/api/library";

// Deklaracja dla globalnego override (TS)
declare global {
    // eslint-disable-next-line no-var
    var __LIBRARY_API_ROOT__: string | undefined;
}
