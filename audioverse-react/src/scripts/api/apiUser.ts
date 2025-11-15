// apiUser.ts
import { apiClient, apiPath } from "./audioverseApiClient";

// Bazowa ścieżka modułu (analogicznie jak DMX/EDITOR)
export const USER_BASE = "/api/user";

// ---- Pamięć tokenów (in-memory; opcjonalnie możesz rozszerzyć o localStorage) ----
let accessToken: string | null = null;
let refreshToken: string | null = null;

// Ustawienie/wyczyszczenie Authorization na globalnym apiClient
const setAuthHeader = (token: string | null) => {
    if (token && token.trim().length > 0) {
        apiClient.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
        delete apiClient.defaults.headers.common["Authorization"];
    }
};

// Zapisywanie tokenów + aktualizacja nagłówka
const saveTokens = (newAccessToken: string, newRefreshToken: string) => {
    accessToken = newAccessToken ?? null;
    refreshToken = newRefreshToken ?? null;
    setAuthHeader(accessToken);
};

// Publiczne gettery (np. do guardów/stanów UI)
export const getAccessToken = () => accessToken;
export const getRefreshToken = () => refreshToken;

// ---- Endpoints ----

// Rejestracja użytkownika
export const registerUser = async (userData: {
    username: string;
    email: string;
    password: string;
}) => {
    const { data } = await apiClient.post(
        apiPath(USER_BASE, "/register"),
        userData
    );
    return data;
};

// Logowanie użytkownika
export const loginUser = async (credentials: {
    username: string;
    password: string;
}) => {
    const { data } = await apiClient.post(
        apiPath(USER_BASE, "/login"),
        credentials
    );
    // Oczekujemy accessToken + refreshToken w odpowiedzi
    if (data?.accessToken && data?.refreshToken) {
        saveTokens(data.accessToken, data.refreshToken);
    }
    return data;
};

// Odświeżenie tokena
export const refreshTokenUser = async () => {
    if (!refreshToken) throw new Error("Brak tokena odświeżania");

    const { data } = await apiClient.post(apiPath(USER_BASE, "/refresh-token"), {
        accessToken,
        refreshToken,
    });

    if (data?.accessToken && data?.refreshToken) {
        saveTokens(data.accessToken, data.refreshToken);
    }
    return data;
};

// Wylogowanie użytkownika
export const logoutUser = async (userId: number) => {
    try {
        await apiClient.post(apiPath(USER_BASE, "/logout"), { userId });
    } finally {
        // zawsze czyść tokeny lokalnie
        saveTokens("", "");
    }
};

// Domyślny export zgodny z Twoim poprzednim API
export default {
    registerUser,
    loginUser,
    refreshTokenUser,
    logoutUser,
    getAccessToken,
    getRefreshToken,
};
