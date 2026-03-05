import React from "react";
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";

// ── Mocks ─────────────────────────────────────────────────────

const mockGetAuditLogsAll = vi.fn();
vi.mock("../scripts/api/apiUser", () => ({
    default: { getAuditLogsAll: () => mockGetAuditLogsAll() },
}));

vi.mock("react-i18next", () => ({
    useTranslation: () => ({ t: (key: string) => key }),
}));

import AuditLogsPage from "../pages/admin/AuditLogsPage";

// ── Sample data ───────────────────────────────────────────────

const sampleLogs = [
    {
        id: 1,
        userId: 10,
        action: "Login",
        timestamp: "2025-01-15T10:30:00Z",
        username: "admin",
        description: "Successful login",
        success: true,
        ipAddress: "192.168.1.1",
        userAgent: "Mozilla/5.0",
    },
    {
        id: 2,
        userId: 11,
        action: "PasswordChange",
        timestamp: "2025-01-16T14:00:00Z",
        username: "user2",
        description: "Password reset",
        success: false,
        ipAddress: "10.0.0.1",
        userAgent: "Chrome/120",
    },
];

describe("AuditLogsPage", () => {
    beforeEach(() => vi.clearAllMocks());

    it("shows loading state initially", () => {
        mockGetAuditLogsAll.mockReturnValue(new Promise(() => {})); // never resolves
        render(<AuditLogsPage />);
        expect(screen.getByText("common.loading")).toBeInTheDocument();
    });

    it("renders logs in a table after fetch", async () => {
        mockGetAuditLogsAll.mockResolvedValue(sampleLogs);
        render(<AuditLogsPage />);

        await waitFor(() => {
            expect(screen.getByText("admin")).toBeInTheDocument();
            expect(screen.getByText("user2")).toBeInTheDocument();
        });
    });

    it("handles { logs: [...] } response shape", async () => {
        mockGetAuditLogsAll.mockResolvedValue({ logs: sampleLogs });
        render(<AuditLogsPage />);

        await waitFor(() => {
            expect(screen.getByText("admin")).toBeInTheDocument();
        });
    });

    it("shows empty row when no logs", async () => {
        mockGetAuditLogsAll.mockResolvedValue([]);
        render(<AuditLogsPage />);

        await waitFor(() => {
            expect(screen.getByText("auditLogsPage.empty")).toBeInTheDocument();
        });
    });

    it("shows error when fetch fails", async () => {
        mockGetAuditLogsAll.mockRejectedValue(new Error("Server error"));
        render(<AuditLogsPage />);

        await waitFor(() => {
            expect(screen.getByText("auditLogsPage.fetchError")).toBeInTheDocument();
        });
    });

    it("filters by username", async () => {
        mockGetAuditLogsAll.mockResolvedValue(sampleLogs);
        render(<AuditLogsPage />);

        await waitFor(() => expect(screen.getByText("admin")).toBeInTheDocument());

        await act(async () => {
            fireEvent.change(screen.getByLabelText("auditLogsPage.userAria"), {
                target: { value: "admin" },
            });
        });

        // Wait for debounce (300ms)
        await waitFor(
            () => {
                expect(screen.getByText("admin")).toBeInTheDocument();
                expect(screen.queryByText("user2")).not.toBeInTheDocument();
            },
            { timeout: 1000 },
        );
    });

    it("filters by action", async () => {
        mockGetAuditLogsAll.mockResolvedValue(sampleLogs);
        render(<AuditLogsPage />);

        await waitFor(() => expect(screen.getByText("admin")).toBeInTheDocument());

        await act(async () => {
            fireEvent.change(screen.getByLabelText("auditLogsPage.actionAria"), {
                target: { value: "Password" },
            });
        });

        await waitFor(
            () => {
                expect(screen.queryByText("admin")).not.toBeInTheDocument();
                expect(screen.getByText("user2")).toBeInTheDocument();
            },
            { timeout: 1000 },
        );
    });

    it("renders table headers", async () => {
        mockGetAuditLogsAll.mockResolvedValue([]);
        render(<AuditLogsPage />);

        await waitFor(() => {
            expect(screen.getByText("auditLogsPage.user")).toBeInTheDocument();
            expect(screen.getByText("auditLogsPage.date")).toBeInTheDocument();
            expect(screen.getByText("auditLogsPage.action")).toBeInTheDocument();
            expect(screen.getByText("auditLogsPage.status")).toBeInTheDocument();
            expect(screen.getByText("auditLogsPage.ip")).toBeInTheDocument();
            expect(screen.getByText("auditLogsPage.userAgent")).toBeInTheDocument();
        });
    });
});
