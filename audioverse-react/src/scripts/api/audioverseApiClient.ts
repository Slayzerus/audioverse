// audioverseApiClient.ts
import axios from "axios";
import { logger } from "../../utils/logger";
import { API_ROOT } from "../../config/apiConfig";
export { API_ROOT } from "../../config/apiConfig";
const log = logger.scoped('audioverseApiClient');

axios.defaults.withCredentials = true;

// Main axios client
export const apiClient = axios.create({
    baseURL: API_ROOT,
    headers: { "Content-Type": "application/json" },
    withCredentials: true,
});

// Interceptor for adding Authorization header from current token
// Import after creating apiClient to avoid circular dependency
apiClient.interceptors.request.use((config) => {
    // Dynamically get the token at request time
    // This will be resolved by apiUser module
    const getToken = () => {
        try {
            const stored = localStorage.getItem("audioverse_access_token");
            if (stored) {
                return stored;
            }
        } catch (_e) {
            // Expected: localStorage may be unavailable (SSR/private browsing)
        }
        return null;
    };
    
    const token = getToken();
    if (token) {
        const headerValue = `Bearer ${token}`;
        config.headers.Authorization = headerValue;
    }

    // Add X-Correlation-ID for request tracing (matches backend middleware)
    if (!config.headers["X-Correlation-ID"]) {
        config.headers["X-Correlation-ID"] = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }

    // Add api-version header (default 1.0)
    if (!config.headers["api-version"]) {
        config.headers["api-version"] = "1.0";
    }

    return config;
}, (error) => {
    return Promise.reject(error);
});

// Response interceptor to log 401 errors
// Session timeout handler: auto logout and redirect on 401
// Rate limiting for error logging
const errorLogCache = new Map<string, number>();
const ERROR_LOG_COOLDOWN = 2000; // 2 seconds between logging the same error

apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const errorKey = `${error.config?.url}-${error.response?.status}`;
        const now = Date.now();
        const lastLog = errorLogCache.get(errorKey) || 0;
        
        // HTTP 429 Too Many Requests — automatic retry with Retry-After
        if (error.response?.status === 429 && error.config && !error.config._retryCount) {
            const retryAfter = error.response.headers["retry-after"];
            const delayMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : 2000;
            const maxRetries = 2;
            error.config._retryCount = (error.config._retryCount || 0) + 1;

            if (error.config._retryCount <= maxRetries) {
                log.warn(`Rate limited (429), retrying in ${delayMs}ms...`, error.config.url);
                await new Promise((resolve) => setTimeout(resolve, Math.min(delayMs, 30000)));
                return apiClient(error.config);
            }
        }
        
        // Log only if enough time has passed since the last log
        if (now - lastLog > ERROR_LOG_COOLDOWN) {
            errorLogCache.set(errorKey, now);
            
            if (error.response?.status === 401) {
                log.warn("Got 401 Unauthorized for:", error.config?.url);
            } else if (error.code === 'ERR_INSUFFICIENT_RESOURCES' || error.response?.status === 503) {
                log.error("Backend overloaded - rate limiting requests:", error.config?.url);
            }
        }
        
        if (error.response?.status === 401) {
            // Only clear token and redirect if we're on a page that requires auth
            // Don't redirect from public pages like / (homepage), /register etc.
            const publicPaths = ["/", "/login", "/register", "/forgot-password"];
            const isPublicPage = publicPaths.includes(window.location.pathname);
            try {
                localStorage.removeItem("audioverse_access_token");
            } catch { /* Best-effort — no action needed on failure */ }
            if (!isPublicPage) {
                window.location.href = "/login";
            }
        }
        return Promise.reject(error);
    }
);

// Helper function for building module paths
export const apiPath = (moduleBase: string, path: string) =>
    `${moduleBase.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;

// Module constants
export const DMX_BASE = "/api/dmx";
export const EDITOR_BASE = "/api/editor";

// Constants taken from libraryApiClient (Library API incorporated into AudioVerse API)
export const AUTH_BASE = "/api/auth";
export const PLAYLIST_BASE = "/api/library/playlists";
export const LIBRARY_BASE = "/api/library";
