// OTP
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface GenerateOtpRequest {
    // Intentionally empty – backend may add params later
}

export interface OtpHistoryEntry {
    id: number;
    userId: number;
    otp: string;
    createdAt: string;
    expiresAt: string;
    used: boolean;
}
// modelsAdmin.ts - Admin-related models

// ---- Commands and Requests ----

export interface ChangeAdminPasswordCommand {
    currentPassword: string;
    newPassword: string;
}

export interface AdminChangeUserPasswordRequest {
    password: string;
}

export interface UpdateUserDetailsRequest {
    username?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    fullName?: string;
    requirePasswordChange?: boolean;
    passwordExpiryDate?: string;
}

export interface AdminCreateUserCommand {
    username: string;
    email: string;
    password: string;
    fullName?: string;
    firstName?: string;
    lastName?: string;
}

export interface BlockUserRequest {
    isBlocked: boolean;
    blockedUntil?: string; // ISO 8601 date or null for permanent
    reason?: string;
}

export interface SetPasswordValidityRequest {
    validUntil?: string; // ISO 8601 date or null for permanent
}

// ---- DTOs ----

export interface UserDetailsDto {
    id: number;
    username: string;
    userName?: string; // for compatibility with the backend
    email: string;
    firstName?: string;
    lastName?: string;
    fullName?: string; // for compatibility with the backend
    isBlocked: boolean;
    blockedUntil?: string;
    passwordValidUntil?: string;
    createdAt: string;
    requirePasswordChange?: boolean;
    passwordExpiryDate?: string;
}

export interface PasswordRequirementsDto {
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireDigit: boolean;
    requireSpecialChar: boolean;
    minLength: number;
    maxLength: number;
}

// ── System Config ──

export interface SystemConfigDto {
    sessionTimeoutMinutes: number;
    captchaOption: number;
    maxMicrophonePlayers: number;
    active: boolean;
    showBreadcrumbs: boolean;
}

export interface UpdateSystemConfigurationRequest {
    sessionTimeoutMinutes: number;
    captchaOption: number;
    maxMicrophonePlayers: number;
    active: boolean;
    showBreadcrumbs: boolean;
}
