// Security-related DTOs (extracted from generated Api.ts)

export interface AuditLogDto {
    id: number;
    userId: number;
    action: string;
    timestamp: string;
    details?: string;
    username?: string;
    description?: string;
    success?: boolean;
    ipAddress?: string;
    userAgent?: string;
}

export interface HoneyTokenDto {
    id: number;
    type: string;
    description: string;
    createdAt: string;
}

export interface TriggeredHoneyTokenDto {
    id: number;
    tokenId: number;
    triggeredAt: string;
    triggeringUserId?: number;
    details?: string;
}
