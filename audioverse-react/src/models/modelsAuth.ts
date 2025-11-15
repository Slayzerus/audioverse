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
