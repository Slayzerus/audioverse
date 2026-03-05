import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import { GamepadNavigationProvider } from "./contexts/GamepadNavigationContext";
import "./i18n/i18n"; // Initialize i18next before app renders
import { ThemeProvider } from "./contexts/ThemeContext";
import { TutorialProvider } from "./contexts/TutorialContext";
import { RTCProvider } from "./contexts/RTCContext";
import { ContextProvider } from "./contexts/ContextProvider";
import { ToastProvider } from "./components/ui/ToastProvider";
import { ConfirmProvider } from "./components/ui/ConfirmProvider";
import ErrorBoundary from "./components/common/ErrorBoundary";
import { logger } from "./utils/logger";
const log = logger.scoped('Main');
import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";
import { loadRemoteScoringPresets } from "./constants/karaokeScoringConfig";
import { initKaraokeDisplaySettings, hydrateKaraokeDisplayFromBackend } from "./scripts/karaoke/karaokeDisplaySettings";
import { hydratePlayerKaraokeSettingsFromBackend } from "./scripts/karaoke/glossyBarRenderer";
import { hydrateGamepadMappingFromBackend } from "./utils/gamepadMapping";
import { hydrateThemeCatalogFromBackend } from "./themes/themeCatalog";

// ── Global safety net: show visible error instead of blank page ──
window.addEventListener("error", (e) => {
    const root = document.getElementById("root");
    if (root && !root.hasChildNodes()) {
        root.innerHTML = `<div style="padding:2rem;color:#f44;font-family:sans-serif">
            <h2>\u26A0\uFE0F Application failed to load</h2>
            <pre style="white-space:pre-wrap;color:#ccc">${e.message}\n${e.filename}:${e.lineno}</pre>
            <button onclick="location.reload()" style="margin-top:1rem;padding:.5rem 1rem;cursor:pointer">Reload</button>
        </div>`;
    }
});
window.addEventListener("unhandledrejection", (e) => {
    log.error("[unhandledrejection]", e.reason);
});

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <ErrorBoundary>
            <ThemeProvider>
                <TutorialProvider>
                    <QueryClientProvider client={queryClient}>
                        <ContextProvider>
                            <RTCProvider>
                                <GamepadNavigationProvider>
                                    <ToastProvider>
                                        <ConfirmProvider>
                                            <App />
                                        </ConfirmProvider>
                                    </ToastProvider>
                                </GamepadNavigationProvider>
                            </RTCProvider>
                        </ContextProvider>
                    </QueryClientProvider>
                </TutorialProvider>
            </ThemeProvider>
        </ErrorBoundary>
    </React.StrictMode>
);

// Load remote scoring presets in background (non-blocking)
loadRemoteScoringPresets().catch(() => { /* Expected: network may be unavailable */ });

// Apply persisted karaoke display settings (gradients, animation mode) as CSS vars
initKaraokeDisplaySettings();

// Hydrate utility-module settings from backend (non-blocking, merges with localStorage)
hydrateKaraokeDisplayFromBackend().catch(() => { /* Expected: network may be unavailable */ });
hydratePlayerKaraokeSettingsFromBackend().catch(() => { /* Expected: network may be unavailable */ });
hydrateGamepadMappingFromBackend().catch(() => { /* Expected: network may be unavailable */ });
hydrateThemeCatalogFromBackend().catch(() => { /* Expected: network may be unavailable */ });
