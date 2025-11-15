// audioverseApiClient.ts
import axios from "axios";

/**
 * Jedno źródło prawdy dla hosta API.
 * Priorytet: Vite env -> CRA env -> window global -> domyślny.
 */
/*const DEFAULT_API_ROOT = "https://api.audioverse.io";*/
const DEFAULT_API_ROOT = "http://localhost:5000";
axios.defaults.withCredentials = true;

// bezpieczne pobranie Vite env (import.meta.env.*)
const fromVite = (() => {
    try {
        return (import.meta as any)?.env?.VITE_AUDIOVERSE_API_ROOT as string | undefined;
    } catch {
        return undefined;
    }
})();

// bez bezpośredniego użycia `process` (TS nie zna typu w przeglądarce)
const fromCra = (globalThis as any)?.process?.env?.REACT_APP_AUDIOVERSE_API_ROOT as
    | string
    | undefined;

// możliwość nadpisania w oknie (np. <script>window.__AUDIOVERSE_API_ROOT__="..."</script>)
const fromWindow = (globalThis as any)?.__AUDIOVERSE_API_ROOT__ as string | undefined;

export const API_ROOT: string = fromVite || fromCra || fromWindow || DEFAULT_API_ROOT;

// Główny klient axios
export const apiClient = axios.create({
    baseURL: API_ROOT,
    headers: { "Content-Type": "application/json" },
});

// Pomocnicza funkcja do budowy ścieżek modułów
export const apiPath = (moduleBase: string, path: string) =>
    `${moduleBase.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;

// Stałe modułów
export const DMX_BASE = "/api/dmx";
export const EDITOR_BASE = "/api/editor";

// (opcjonalnie) deklaracja dla globalnego override w oknie — żeby TS nie marudził:
declare global {
    // eslint-disable-next-line no-var
    var __AUDIOVERSE_API_ROOT__: string | undefined;
}
