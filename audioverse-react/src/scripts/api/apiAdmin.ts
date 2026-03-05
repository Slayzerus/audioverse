// apiAdmin.ts — Admin API endpoints
import { apiClient, apiPath } from "./audioverseApiClient";
import {
    GenerateOtpRequest,
    OtpHistoryEntry,
    ChangeAdminPasswordCommand,
    AdminChangeUserPasswordRequest,
    UpdateUserDetailsRequest,
    AdminCreateUserCommand,
    BlockUserRequest,
    SetPasswordValidityRequest,
    UserDetailsDto,
    PasswordRequirementsDto,
} from "../../models/modelsAdmin";
import { UserBan } from "../../models/modelsKaraoke";
import { ScoringPreset, DifficultyLevel } from "../../constants/karaokeScoringConfig";

// Base path for admin module
export const ADMIN_BASE = "/api/admin";
export const PASSWORD_REQUIREMENTS_BASE = "/api/password-requirements";

// ---- OTP Endpoints ----

// Generating OTP for user
export const generateOtpForUser = async (userId: number, payload?: GenerateOtpRequest) => {
    const { data } = await apiClient.post(apiPath(ADMIN_BASE, `/users/${userId}/generate-otp`), payload ?? {});
    return data;
};

// Get OTP history
export const getOtpHistory = async (): Promise<OtpHistoryEntry[]> => {
    const { data } = await apiClient.get(apiPath(ADMIN_BASE, "/otp-history"));
    return data;
};

// ---- HoneyToken Endpoints ----

/**
 * Create a new HoneyToken
 * POST /api/user/honeytokens/create
 */
export const createHoneyToken = async (payload: { name: string; description?: string; type?: string }) => {
    const res = await apiClient.post(
        apiPath("/api/user", "/honeytokens/create"),
        payload
    );
    return res.data;
};

/**
 * Get triggered HoneyTokens
 * GET /api/user/honeytokens/triggered
 */
export const getTriggeredHoneyTokens = async () => {
    const { data } = await apiClient.get(apiPath("/api/user", "/honeytokens/triggered"));
    return data;
};

// ---- Admin Endpoints ----

// Get all login attempts (admin)
export const getAllLoginAttempts = async () => {
    const { data } = await apiClient.get(apiPath(ADMIN_BASE, "/login-attempts"));
    return data;
};

// Get login attempts for a specific user
export const getLoginAttemptsForUser = async (userId: number) => {
    const { data } = await apiClient.get(apiPath(ADMIN_BASE, `/login-attempts/${userId}`));
    return data;
};

// Get recent failed login attempts (brute force detection)
export const getRecentFailedLoginAttempts = async (minutes: number = 15) => {
    const { data } = await apiClient.get(apiPath(ADMIN_BASE, `/login-attempts/recent-failed?minutes=${minutes}`));
    return data;
};

/**
 * Change password for the current admin user
 */
export const changeAdminPassword = async (
    command: ChangeAdminPasswordCommand
) => {
    await apiClient.post(apiPath(ADMIN_BASE, "/change-password"), command);
};

/**
 * Get all users
 */
export const getAllUsers = async (): Promise<UserDetailsDto[]> => {
    const res = await apiClient.get<UserDetailsDto[]>(
        apiPath(ADMIN_BASE, "/users")
    );
    return res.data;
};

/**
 * Create a new user (admin endpoint)
 */
export const createUser = async (
    command: AdminCreateUserCommand
): Promise<number> => {
    const res = await apiClient.post<number>(
        apiPath(ADMIN_BASE, "/users"),
        command
    );
    return res.data;
};

/**
 * Update user details (admin endpoint)
 */
export const updateUserDetails = async (
    userId: number,
    request: UpdateUserDetailsRequest
) => {
    await apiClient.put(
        apiPath(ADMIN_BASE, `/users/${userId}`),
        request
    );
};

/** @internal * Delete a user (admin endpoint) */
export const deleteUser = async (userId: number) => {
    await apiClient.delete(apiPath(ADMIN_BASE, `/users/${userId}`));
};

/**
 * Change password for a specific user (admin endpoint)
 */
export const changeUserPassword = async (
    userId: number,
    request: AdminChangeUserPasswordRequest
) => {
    await apiClient.post(
        apiPath(ADMIN_BASE, `/users/${userId}/change-password`),
        request
    );
};

/**
 * Block or unblock a user
 */
export const blockUser = async (
    userId: number,
    request: BlockUserRequest
) => {
    await apiClient.post(
        apiPath(ADMIN_BASE, `/users/${userId}/block`),
        request
    );
};

/**
 * Set password validity period for a user
 */
export const setPasswordValidity = async (
    userId: number,
    request: SetPasswordValidityRequest
) => {
    await apiClient.post(
        apiPath(ADMIN_BASE, `/users/${userId}/password-validity`),
        request
    );
};

// ---- Password Requirements Endpoints ----

/**
 * Get all password requirements (array-based API)
 */
export const getPasswordRequirements = async (): Promise<PasswordRequirementsDto[]> => {
    const res = await apiClient.get<PasswordRequirementsDto[]>(
        apiPath(PASSWORD_REQUIREMENTS_BASE, "")
    );
    return res.data;
};

/**
 * Set password requirements (array-based API)
 */
export const setPasswordRequirements = async (
    requirements: PasswordRequirementsDto[]
) => {
    await apiClient.post(
        apiPath(PASSWORD_REQUIREMENTS_BASE, ""),
        requirements
    );
};

// System config endpoints

export interface FeatureVisibilityOverrideDto {
    featureId: string;
    hidden: boolean;
    visibleToRoles: string[];
}

export interface SystemConfigDto {
    id: number;
    sessionTimeoutMinutes: number;
    captchaOption: number;
    maxMicrophonePlayers: number;
    globalMaxListenersPerStation?: number | null;
    globalMaxTotalListeners?: number | null;
    active: boolean;
    featureVisibilityOverrides?: FeatureVisibilityOverrideDto[];
    modifiedAt?: string;
    modifiedByUserId?: number | null;
    modifiedByUsername?: string | null;
}

/** New SystemConfigurationController — returns DTO directly (with feature overrides) */
const SYSTEM_CONFIG_BASE = "/api/admin/system-configuration";

export const getSystemConfig = async (): Promise<SystemConfigDto> => {
    const { data } = await apiClient.get(apiPath(SYSTEM_CONFIG_BASE, ""));
    return data;
};

export const updateSystemConfig = async (config: Partial<SystemConfigDto>) => {
    const { data } = await apiClient.put(apiPath(SYSTEM_CONFIG_BASE, ""), config);
    return data;
};

// ── Feature Visibility Overrides (dedicated endpoints) ──────────

/** GET /api/admin/system-configuration/features */
export const getFeatureOverrides = async (): Promise<FeatureVisibilityOverrideDto[]> => {
    const { data } = await apiClient.get(apiPath(SYSTEM_CONFIG_BASE, "/features"));
    return data;
};

/** PUT /api/admin/system-configuration/features — upsert (full snapshot) */
export const putFeatureOverrides = async (overrides: FeatureVisibilityOverrideDto[]): Promise<{ updated: number }> => {
    const { data } = await apiClient.put(apiPath(SYSTEM_CONFIG_BASE, "/features"), overrides);
    return data;
};

// ---- Scoring Presets Endpoints (optional, backend may not exist) ----

export const getScoringPresets = async (): Promise<{ presets?: Partial<Record<DifficultyLevel, Partial<ScoringPreset>>> } | null> => {
    const { data } = await apiClient.get(apiPath(ADMIN_BASE, "/scoring-presets"));
    return data;
};

export const setScoringPresets = async (payload: Record<string, unknown> | { presets?: Partial<Record<DifficultyLevel, Partial<ScoringPreset>>> }) => {
    const { data } = await apiClient.post(apiPath(ADMIN_BASE, "/scoring-presets"), payload);
    return data;
};

// ── Phase 10: New Admin Endpoints ─────────────────────────────

/** GET /api/admin/dashboard — Admin dashboard stats */
export const getAdminDashboard = async (): Promise<unknown> => {
    const { data } = await apiClient.get(apiPath(ADMIN_BASE, "/dashboard"));
    return data;
};

/** GET /api/admin/events — List events (admin view, paginated) */
export const getAdminEvents = async (page = 1, pageSize = 20, type?: string): Promise<unknown> => {
    const params: Record<string, unknown> = { page, pageSize };
    if (type) params.type = type;
    const { data } = await apiClient.get(apiPath(ADMIN_BASE, "/events"), { params });
    return data;
};

/** GET /api/admin/users/list — Get user list (admin panel) */
export const getUsersList = async (): Promise<UserDetailsDto[]> => {
    const { data } = await apiClient.get<UserDetailsDto[]>(apiPath(ADMIN_BASE, "/users/list"));
    return data ?? [];
};

/** POST /api/admin/users/{userId}/ban — Ban a user */
export const banUser = async (userId: number, ban: UserBan): Promise<void> => {
    await apiClient.post(apiPath(ADMIN_BASE, `/users/${userId}/ban`), ban);
};

/** DELETE /api/admin/bans/{banId} — Lift (deactivate) a ban */
export const liftBan = async (banId: number): Promise<void> => {
    await apiClient.delete(apiPath(ADMIN_BASE, `/bans/${banId}`));
};

/** GET /api/admin/users/{userId}/bans — List active bans for user */
export const getUserBans = async (userId: number): Promise<UserBan[]> => {
    const { data } = await apiClient.get<UserBan[]>(apiPath(ADMIN_BASE, `/users/${userId}/bans`));
    return data ?? [];
};

// Default export
export default {
    changeAdminPassword,
    getAllUsers,
    createUser,
    updateUserDetails,
    deleteUser,
    changeUserPassword,
    blockUser,
    setPasswordValidity,
    getPasswordRequirements,
    setPasswordRequirements,
    createHoneyToken,
    getTriggeredHoneyTokens,
    generateOtpForUser,
    getOtpHistory,
    getAllLoginAttempts,
    getLoginAttemptsForUser,
    getRecentFailedLoginAttempts,
    getSystemConfig,
    updateSystemConfig,
    getFeatureOverrides,
    putFeatureOverrides,
    getScoringPresets,
    setScoringPresets,
    // Phase 10: new endpoints
    getAdminDashboard,
    getAdminEvents,
    getUsersList,
    banUser,
    liftBan,
    getUserBans,
};

// Re-export models for convenience
export type {
    ChangeAdminPasswordCommand,
    AdminChangeUserPasswordRequest,
    UpdateUserDetailsRequest,
    AdminCreateUserCommand,
    BlockUserRequest,
    SetPasswordValidityRequest,
    UserDetailsDto,
    PasswordRequirementsDto,
} from "../../models/modelsAdmin";
