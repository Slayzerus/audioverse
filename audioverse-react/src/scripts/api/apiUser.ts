import {
    FirstLoginPasswordChangeRequest,
    ChangePasswordWithRecaptchaRequest,
    RecaptchaVerifyRequest,
    RecaptchaVerifyResponse
} from "../../models/modelsAuth";
// Password change on first login
export const firstLoginPasswordChange = async (payload: FirstLoginPasswordChangeRequest) => {
    const { data } = await apiClient.post(apiPath(USER_BASE, "/first-login-password-change"), payload);
    return data;
};

// Password change with reCaptcha
export const changePasswordWithRecaptcha = async (payload: ChangePasswordWithRecaptchaRequest) => {
    const { data } = await apiClient.post(apiPath(USER_BASE, "/change-password-with-recaptcha"), payload);
    return data;
};

// Weryfikacja reCaptcha
export const verifyRecaptcha = async (payload: RecaptchaVerifyRequest): Promise<RecaptchaVerifyResponse> => {
    const { data } = await apiClient.post(apiPath(USER_BASE, "/recaptcha/verify"), payload);
    return data;
};
// User password change
export const changePassword = async (oldPassword: string, newPassword: string) => {
    const { data } = await apiClient.post(apiPath(USER_BASE, "/change-password"), {
        oldPassword,
        newPassword
    });
    return data;
};
// Create a new HoneyToken
export const createHoneyToken = async (data: Record<string, unknown>) => {
    const res = await apiClient.post(apiPath(USER_BASE, '/honeytokens/create'), data);
    return res.data;
};

// Get list of active HoneyTokens
export const getHoneyTokens = async () => {
    const res = await apiClient.get(apiPath(USER_BASE, '/honeytokens'));
    return res.data;
};

// Get triggered HoneyTokens
export const getTriggeredHoneyTokens = async () => {
    const res = await apiClient.get(apiPath(USER_BASE, '/honeytokens/triggered'));
    return res.data;
};
// Walidacja CAPTCHA
export const validateCaptcha = async (data: { captchaId: string, answer: string }) => {
    const url = apiPath(USER_BASE, "/captcha/validate");
    const res = await apiClient.post(url, data);
    return res.data;
};
// CAPTCHA generation
export const generateCaptcha = async (captchaType: number) => {
    const url = apiPath(USER_BASE, "/captcha/generate");
    const { data } = await apiClient.post(
        url,
        {},
        { params: { captchaType } }
    );
    return data;
};
// DeviceType enum
export enum DeviceType {
  Unknown = 0,
  Microphone = 1,
  Gamepad = 2,
  Keyboard = 3,
  Mouse = 4,
  Speaker = 5,
  Camera = 6,
}

// Device DTOs
export interface DeviceDto {
  id: number;
  userId: number;
  deviceId: string;
    // Optional extended fields the backend may return/store
    deviceName?: string;
    userDeviceName?: string;
  deviceType: DeviceType;
  visible: boolean;
  createdAt: string;
  updatedAt: string;
}
export enum PitchDetectionMethod {
    UltrastarWP = 0,
    Crepe = 1,
    Aubio = 2,
    Pitchy = 3,
    Librosa = 4
}
export interface MicrophoneDto {
    id: number;
    userId: number;
    deviceId: string;
    // Optional extended microphone fields
    micGain?: number;
    pitchThreshold?: number;
    pitchDetectionMethod?: PitchDetectionMethod;
    // per-backend: offset in milliseconds (user-configured latency correction)
    offsetMs?: number;
    // RMS threshold below which sound is ignored (like in UltraStar WorldParty)
    rmsThreshold?: number;
    smoothingWindow?: number;
    useHanning?: boolean;
    monitorEnabled?: boolean;
    monitorVolume?: number;
    hysteresisFrames?: number;
    volume: number;
    threshold: number;
    visible: boolean;
    createdAt: string;
    updatedAt: string;
}

// Device API
export const getUserDevices = async () => {
  const { data } = await apiClient.get("/api/user/devices");
  return data;
};
export const createDevice = async (payload: { deviceId: string; deviceType: DeviceType; visible?: boolean; deviceName?: string; userDeviceName?: string }) => {
    const { data } = await apiClient.post("/api/user/devices", payload);
    return data;
};
export const updateDevice = async (deviceRecordId: number, payload: Partial<DeviceDto>) => {
  const { data } = await apiClient.put(`/api/user/devices/${deviceRecordId}`, payload);
  return data;
};
/** @internal */
export const deleteDevice = async (deviceRecordId: number) => {
  const { data } = await apiClient.delete(`/api/user/devices/${deviceRecordId}`);
  return data;
};

// Microphone API
export const getUserMicrophones = async () => {
  const { data } = await apiClient.get("/api/user/microphones");
  return data;
};
export const createMicrophone = async (payload: { deviceId: string; volume?: number; threshold?: number; visible?: boolean; micGain?: number; pitchThreshold?: number; pitchDetectionMethod?: PitchDetectionMethod; offsetMs?: number; monitorEnabled?: boolean; monitorVolume?: number; smoothingWindow?: number; hysteresisFrames?: number; rmsThreshold?: number; useHanning?: boolean }) => {
  const { data } = await apiClient.post("/api/user/microphones", payload);
  return data;
};
export const updateMicrophone = async (microphoneRecordId: number, payload: Partial<MicrophoneDto>) => {
  const { data } = await apiClient.put(`/api/user/microphones/${microphoneRecordId}`, payload);
  return data;
};
/** @internal */
export const deleteMicrophone = async (microphoneRecordId: number) => {
  const { data } = await apiClient.delete(`/api/user/microphones/${microphoneRecordId}`);
  return data;
};
// apiUser.ts
import { apiClient, apiPath } from "./audioverseApiClient";
import { API_ROOT } from "../../config/apiConfig";
import { LoginResponse } from "../../models/modelsAuth";

// Base module path (analogous to DMX/EDITOR)
export const USER_BASE = "/api/user";

// ---- Type Definitions ----
export interface CurrentUserPlayer {
    id: number;
    name: string;
    profileId: number;
    isPrimary: boolean;
    preferredColors: string;
    fillPattern: string;
    email?: string | null;
    icon?: string | null;
    photoUrl?: string | null;
}

export interface CurrentUserResponse {
    success: boolean;
    userId: number;
    username: string;
    roles: string[];
    isAdmin: boolean;
    requirePasswordChange?: boolean;
    /**
     * Player entities owned by this user (UserProfilePlayer[]).
     * Always populated by GET /api/user/me.
     */
    players: CurrentUserPlayer[];
}
// ---- Token memory + localStorage for persistence ----
// NOTE: refreshToken is now stored as httpOnly cookie (av_refresh_token)
// set by the backend. JS never reads/writes it.
let accessToken: string | null = null;

const STORAGE_KEY_ACCESS = "audioverse_access_token";

// Setting/clearing Authorization on the global apiClient
const setAuthHeader = (token: string | null) => {
    if (token && token.trim().length > 0) {
        apiClient.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
        delete apiClient.defaults.headers.common["Authorization"];
    }
};

// Saving access token + updating header + localStorage
// Refresh token is managed as httpOnly cookie by the backend.
const saveAccessToken = (newAccessToken: string) => {
    accessToken = newAccessToken ?? null;
    setAuthHeader(accessToken);
    
    // Save to localStorage for persistence across page reloads
    if (accessToken) {
        localStorage.setItem(STORAGE_KEY_ACCESS, accessToken);
    } else {
        localStorage.removeItem(STORAGE_KEY_ACCESS);
    }
};

// Token initialization from localStorage (call at startup)
// Only access token is stored in localStorage; refresh token lives in httpOnly cookie.
export const initTokensFromStorage = () => {
    const storedAccess = localStorage.getItem(STORAGE_KEY_ACCESS);
    
    if (storedAccess) {
        accessToken = storedAccess;
        setAuthHeader(accessToken);
    }

    // Backward-compat cleanup: remove old refresh token from localStorage if present
    try { localStorage.removeItem('audioverse_refresh_token'); } catch { /* Best-effort — no action needed on failure */ }
};

// Public getter (e.g. for guards/UI states)
export const getAccessToken = () => {
    const token = accessToken;
    return token;
};

// ---- Endpoints ----
// Get all user activity logs (for admin panel)
export const getAuditLogsAll = async () => {
    const { data } = await apiClient.get(apiPath(USER_BASE, "/audit-logs/all"));
    return data;
};

// User registration
export const registerUser = async (userData: {
    username: string;
    email: string;
    password: string;
    captchaId?: string | number;
    captchaAnswer?: string;
}) => {
    const { data } = await apiClient.post(
        apiPath(USER_BASE, "/register"),
        userData
    );
    return data;
};

// User login
export const loginUser = async (credentials: {
    username: string;
    password: string;
    captchaId?: string | number;
    captchaAnswer?: string;
}): Promise<LoginResponse> => {
    try {
        const { data } = await apiClient.post(
            apiPath(USER_BASE, "/login"),
            credentials
        );
        if (data?.success && data?.tokenPair?.accessToken) {
            saveAccessToken(data.tokenPair.accessToken);
        }
        return data;
    } catch (err: unknown) {
        // Backend returns error info in response.data for 400
        const respData = typeof err === 'object' && err !== null && 'response' in err ? ((err as Record<string, unknown>).response as Record<string, unknown> | undefined)?.data : undefined;
        if (respData) {
            return respData as LoginResponse;
        }
        return {
            success: false,
            errorMessage: err instanceof Error ? err.message : "Login failed",
        };
    }
};

// Token refresh — refresh token is sent automatically as httpOnly cookie
export const refreshTokenUser = async () => {
    const { data } = await apiClient.post(apiPath(USER_BASE, "/refresh-token"), {
        accessToken,
    });

    if (data?.accessToken) {
        saveAccessToken(data.accessToken);
    }
    return data;
};

// User logout — backend clears the httpOnly refresh cookie
export const logoutUser = async (userId: number) => {
    try {
        await apiClient.post(apiPath(USER_BASE, "/logout"), { userId });
    } finally {
        // Clear access token locally; refresh cookie is cleared server-side
        saveAccessToken("");
    }
};

// Fetching current user data
export const getCurrentUser = async (): Promise<CurrentUserResponse> => {
    const { data } = await apiClient.get<CurrentUserResponse & { user?: CurrentUserResponse }>(
        apiPath(USER_BASE, "/me")
    );
    
    // Handle nested user object if present
    const userResponse = data?.user || data;
    
    return userResponse;
};

// React Query hook for current user
import { useQuery } from '@tanstack/react-query';
export const useCurrentUserQuery = () =>
    useQuery({ queryKey: ['user', 'current'], queryFn: () => getCurrentUser(), staleTime: 60_000, retry: 0 });

    // Profile player API (per-profile players)
    export const getProfilePlayers = async (profileId: number) => {
        const { data } = await apiClient.get(apiPath(USER_BASE, `/profiles/${profileId}/players`));
        return data;
    };
    export const createProfilePlayer = async (
        profileId: number,
        payload: { name?: string; color?: string; preferredColors?: string[]; email?: string; icon?: string; photo?: File },
    ) => {
        const fd = new FormData();
        if (payload.name) fd.append('Name', payload.name);
        if (payload.color) fd.append('Color', payload.color);
        if (payload.preferredColors?.length) fd.append('PreferredColors', payload.preferredColors.join(','));
        if (payload.email) fd.append('Email', payload.email);
        if (payload.icon) fd.append('Icon', payload.icon);
        if (payload.photo) fd.append('Photo', payload.photo);
        const { data } = await apiClient.post(
            apiPath(USER_BASE, `/profiles/${profileId}/players`),
            fd,
            { headers: { 'Content-Type': 'multipart/form-data' } },
        );
        return data;
    };
    export const updateProfilePlayer = async (
        profileId: number,
        playerId: number,
        payload: { id?: number; name?: string; color?: string; preferredColors?: string[]; email?: string; icon?: string; karaokeSettings?: Record<string, unknown> },
    ) => {
        const body: Record<string, unknown> = {};
        if (payload.name != null) body.name = payload.name;
        if (payload.color != null) body.color = payload.color;
        if (payload.preferredColors?.length) body.preferredColors = payload.preferredColors.join(',');
        if (payload.email != null) body.email = payload.email;
        if (payload.icon != null) body.icon = payload.icon;
        if (payload.karaokeSettings != null) body.karaokeSettings = payload.karaokeSettings;
        const { data } = await apiClient.put(apiPath(USER_BASE, `/profiles/${profileId}/players/${playerId}`), body);
        return data;
    };
    export const uploadPlayerPhoto = async (profileId: number, playerId: number, file: File) => {
        const fd = new FormData();
        fd.append('file', file);
        const { data } = await apiClient.post(
            apiPath(USER_BASE, `/profiles/${profileId}/players/${playerId}/photo`),
            fd,
            { headers: { 'Content-Type': 'multipart/form-data' } },
        );
        return data;
    };
    export const getPlayerPhotoUrl = (playerId: number) =>
        `${API_ROOT}/api/user/players/${playerId}/photo`;

    /** Public URL for a user's profile photo (uses UserProfile.PhotoKey, NOT player photo). */
    export const getUserPhotoUrl = (userId: number) =>
        `${API_ROOT}/api/user/profiles/${userId}/photo`;

    /** Upload / replace the current user's profile photo. POST /api/user/photo (multipart) */
    export const uploadUserPhoto = async (file: File) => {
        const fd = new FormData();
        fd.append('file', file);
        const { data } = await apiClient.post(
            apiPath(USER_BASE, '/photo'),
            fd,
            { headers: { 'Content-Type': 'multipart/form-data' } },
        );
        return data;
    };

    /** Delete the current user's profile photo. DELETE /api/user/photo */
    export const deleteUserPhoto = async () => {
        const { data } = await apiClient.delete(apiPath(USER_BASE, '/photo'));
        return data;
    };
/** @internal */
    export const deleteProfilePlayer = async (profileId: number, playerId: number) => {
        const { data } = await apiClient.delete(apiPath(USER_BASE, `/profiles/${profileId}/players/${playerId}`));
        return data;
    };
    // Set a profile player as primary
    export const setProfilePlayerPrimary = async (profileId: number, playerId: number) => {
        const { data } = await apiClient.post(apiPath(USER_BASE, `/profiles/${profileId}/players/${playerId}/set-primary`));
        return data;
    };

// ---- User Settings ----

/** All synced user preferences (mirrors backend UserProfileSettings) */
export interface UserSettingsDto {
    developerMode: boolean;
    jurors: boolean;
    fullscreen: boolean;
    theme: string;
    soundEffects: boolean;
    language: string;
    // ── Synced preferences (previously localStorage-only) ──
    difficulty?: string | null;
    pitchAlgorithm?: string | null;
    completedTutorials?: string | null;
    breadcrumbsEnabled?: boolean;
    karaokeDisplaySettings?: string | null;
    playerKaraokeSettings?: string | null;
    gamepadMapping?: string | null;
    customThemes?: string | null;
    localPlaylists?: string | null;
}

export type UpdateUserSettingsPayload = Partial<UserSettingsDto>;

export const updateUserSettings = async (payload: UpdateUserSettingsPayload) => {
    const { data } = await apiClient.put(apiPath(USER_BASE, "/settings"), payload);
    return data;
};

export const getUserSettings = async (): Promise<UserSettingsDto | null> => {
    try {
        const { data } = await apiClient.get(apiPath(USER_BASE, "/settings"));
        return data?.settings ?? data ?? null;
    } catch {
        /* Expected: network request may fail; caller handles null */
        return null;
    }
};

// ---- Guest Login ----
export const guestLogin = async () => {
    const { data } = await apiClient.post(apiPath(USER_BASE, "/guest-login"));
    if (data?.success && data?.tokenPair?.accessToken) {
        saveAccessToken(data.tokenPair.accessToken);
    }
    return data;
};

// ---- TOTP (2FA) ----
export const totpEnable = async () => {
    const { data } = await apiClient.post(apiPath(USER_BASE, "/totp/enable"));
    return data;
};

export const totpConfirm = async (code: string) => {
    const { data } = await apiClient.post(apiPath(USER_BASE, "/totp/confirm"), { code });
    return data;
};

export const totpVerify = async (userId: number, code: string) => {
    const { data } = await apiClient.post(apiPath(USER_BASE, "/totp/verify"), { userId, code });
    return data;
};

export const totpDisable = async () => {
    const { data } = await apiClient.post(apiPath(USER_BASE, "/totp/disable"));
    return data;
};

// ---- Audit Logs (own) ----
export const getMyAuditLogs = async () => {
    const { data } = await apiClient.get(apiPath(USER_BASE, "/audit-logs"));
    return data;
};

// Default export compatible with your previous API
export default {
    registerUser,
    loginUser,
    guestLogin,
    refreshTokenUser,
    logoutUser,
    getCurrentUser,
    getAccessToken,
    initTokensFromStorage,
    generateCaptcha,
    validateCaptcha,
    createHoneyToken,
    getHoneyTokens,
    getTriggeredHoneyTokens,
    changePassword,
    getAuditLogsAll,
    getMyAuditLogs,
    getUserDevices,
    createDevice,
    updateDevice,
    deleteDevice,
    getUserMicrophones,
    createMicrophone,
    updateMicrophone,
    deleteMicrophone,
    getProfilePlayers,
    createProfilePlayer,
    updateProfilePlayer,
    deleteProfilePlayer,
    setProfilePlayerPrimary,
    uploadPlayerPhoto,
    getPlayerPhotoUrl,
    getUserPhotoUrl,
    uploadUserPhoto,
    deleteUserPhoto,
    updateUserSettings,
    getUserSettings,
    totpEnable,
    totpConfirm,
    totpVerify,
    totpDisable,
};
