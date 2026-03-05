// Password change on first login
export interface FirstLoginPasswordChangeRequest {
    oldPassword: string;
    newPassword: string;
}

// Password change with reCaptcha
export interface ChangePasswordWithRecaptchaRequest {
    oldPassword: string;
    newPassword: string;
    recaptchaToken: string;
}

// Weryfikacja reCaptcha
export interface RecaptchaVerifyRequest {
    recaptchaToken: string;
}

export interface RecaptchaVerifyResponse {
    success: boolean;
    score?: number;
    action?: string;
    challenge_ts?: string;
    hostname?: string;
    errorCodes?: string[];
}
export interface LoginResponse {
    success: boolean;
    errorMessage?: string;
    isBlocked?: boolean;
    userId?: number;
    username?: string;
    tokenPair?: {
        accessToken: string;
        refreshToken?: string; // now httpOnly cookie, may not be in response body
    };
    requirePasswordChange?: boolean;
}
// models/modelsAuth.ts
export interface BuildUrlResponse {
    url: string;
}

export interface TidalAuthTokens {
    accessToken: string;
    refreshToken?: string | null;
    expiresInSeconds: number;
    expiresAt?: string | null; // ISO string
    tokenType?: string | null;
    scope?: string | null;
}

export interface RefreshRequest {
    refreshToken: string;
}

export interface SetTokenRequest {
    accessToken: string;
}
