// apiSystemNotifications.ts — Admin test SMS / email endpoints
import { apiClient, apiPath } from "./audioverseApiClient";

const SYSTEM_BASE = "/api/system/notifications";

// === DTOs ===

export interface TestSmsRequest {
    phone: string;
    message: string;
}

export interface TestEmailRequest {
    to: string;
    subject: string;
    body?: string;
}

export interface TestNotificationResult {
    success: boolean;
    message?: string;
    error?: string;
}

// === API Calls ===

/** @internal POST /api/system/notifications/test-sms?phone=48XXXXXXXXX&message=Hello */
export const postTestSms = async (req: TestSmsRequest): Promise<TestNotificationResult> => {
    const { data } = await apiClient.post<TestNotificationResult>(
        apiPath(SYSTEM_BASE, "/test-sms"),
        null,
        { params: { phone: req.phone, message: req.message } },
    );
    return data;
};

/** @internal POST /api/system/notifications/test-email?to=user@example.com&subject=Test */
export const postTestEmail = async (req: TestEmailRequest): Promise<TestNotificationResult> => {
    const { data } = await apiClient.post<TestNotificationResult>(
        apiPath(SYSTEM_BASE, "/test-email"),
        null,
        { params: { to: req.to, subject: req.subject, body: req.body } },
    );
    return data;
};

export default {
    postTestSms,
    postTestEmail,
};
