import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";

// ── Mocks ─────────────────────────────────────────────────────

vi.mock("react-i18next", () => ({
    useTranslation: () => ({ t: (key: string) => key }),
}));

const mockChangePassword = vi.fn();
const mockGenerateCaptcha = vi.fn();
const mockValidateCaptcha = vi.fn();
vi.mock("../scripts/api/apiUser", () => ({
    changePasswordWithRecaptcha: (...args: unknown[]) => mockChangePassword(...args),
    generateCaptcha: (...args: unknown[]) => mockGenerateCaptcha(...args),
    validateCaptcha: (...args: unknown[]) => mockValidateCaptcha(...args),
}));

const mockGetPasswordRequirements = vi.fn();
vi.mock("../scripts/api/apiAdmin", () => ({
    default: { getPasswordRequirements: () => mockGetPasswordRequirements() },
}));

vi.mock("../components/common/Focusable", () => ({
    Focusable: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("../components/auth/CaptchaComponent", () => ({
    default: ({ onAnswer }: { onAnswer: (v: string) => void; answer: string }) => (
        <div data-testid="captcha">
            <input
                data-testid="captcha-input"
                onChange={e => onAnswer(e.target.value)}
                aria-label="captcha-answer"
            />
        </div>
    ),
}));

vi.mock("../components/auth/PasswordStrengthIndicator", () => ({
    default: ({ rules }: { rules: { label: string; valid: boolean }[] }) => (
        <div data-testid="strength-indicator">
            {rules.map(r => (
                <div key={r.label} data-testid={`rule-${r.label}`} data-valid={r.valid}>
                    {r.label}
                </div>
            ))}
        </div>
    ),
}));

vi.mock("framer-motion", () => ({
    motion: {
        div: React.forwardRef(({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>, ref: React.Ref<HTMLDivElement>) => (
            <div ref={ref} {...(Object.fromEntries(Object.entries(props).filter(([k]) => !["initial", "animate", "exit", "transition"].includes(k))))}>{children}</div>
        )),
    },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import ChangePasswordPage from "../pages/profile/ChangePasswordPage";

// ── Helpers ───────────────────────────────────────────────────

function renderPage() {
    return render(<ChangePasswordPage />);
}

describe("ChangePasswordPage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockGetPasswordRequirements.mockResolvedValue({ requirements: [] });
        mockGenerateCaptcha.mockResolvedValue({ captchaId: "cap1", challenge: "reverse: tset", type: 2 });
        // default: no recaptcha available on window
        delete (window as Record<string, unknown>).grecaptcha;
    });

    it("renders form with current, new and confirm password fields", () => {
        renderPage();
        expect(screen.getByLabelText("auth.currentPassword")).toBeInTheDocument();
        expect(screen.getByLabelText("auth.newPassword")).toBeInTheDocument();
        expect(screen.getByLabelText("auth.confirmPassword")).toBeInTheDocument();
    });

    it("renders submit button", () => {
        renderPage();
        expect(screen.getByText("auth.changePasswordButton")).toBeInTheDocument();
    });

    it("renders captcha component", async () => {
        renderPage();
        await waitFor(() => {
            expect(screen.getByTestId("captcha")).toBeInTheDocument();
        });
    });

    it("renders password strength indicator", () => {
        renderPage();
        expect(screen.getByTestId("strength-indicator")).toBeInTheDocument();
    });

    it("shows error when passwords don't match on submit", async () => {
        mockValidateCaptcha.mockResolvedValue({ success: true });
        renderPage();

        fireEvent.change(screen.getByLabelText("auth.currentPassword"), { target: { value: "oldpw" } });
        fireEvent.change(screen.getByLabelText("auth.newPassword"), { target: { value: "NewPass1!" } });
        fireEvent.change(screen.getByLabelText("auth.confirmPassword"), { target: { value: "Different1!" } });

        // Wait for captcha to load, then fill
        const captchaInput = await waitFor(() => screen.getByTestId("captcha-input"));
        fireEvent.change(captchaInput, { target: { value: "test" } });

        await act(async () => {
            fireEvent.submit(screen.getByText("auth.changePasswordButton"));
        });

        await waitFor(() => {
            expect(screen.getByText("auth.passwordMismatch")).toBeInTheDocument();
        });
    });

    it("does not call changePassword when captcha validation fails", async () => {
        mockValidateCaptcha.mockResolvedValue({ success: false });
        renderPage();

        // Fill valid matching passwords
        fireEvent.change(screen.getByLabelText("auth.currentPassword"), { target: { value: "oldpw" } });
        fireEvent.change(screen.getByLabelText("auth.newPassword"), { target: { value: "NewPass1!" } });
        fireEvent.change(screen.getByLabelText("auth.confirmPassword"), { target: { value: "NewPass1!" } });

        const captchaInput = await waitFor(() => screen.getByTestId("captcha-input"));
        fireEvent.change(captchaInput, { target: { value: "wrong" } });

        await act(async () => {
            fireEvent.submit(screen.getByText("auth.changePasswordButton"));
        });

        await waitFor(() => {
            expect(mockValidateCaptcha).toHaveBeenCalled();
        });
        // changePassword should never be called if captcha fails
        expect(mockChangePassword).not.toHaveBeenCalled();
    });

    it("calls changePasswordWithRecaptcha on valid submit with recaptcha", async () => {
        mockValidateCaptcha.mockResolvedValue({ success: true });
        mockChangePassword.mockResolvedValue({ success: true });

        // Setup window.grecaptcha
        (window as Record<string, unknown>).grecaptcha = {
            ready: (cb: () => void) => cb(),
            execute: vi.fn().mockResolvedValue("recaptcha-token-123"),
        };

        renderPage();

        fireEvent.change(screen.getByLabelText("auth.currentPassword"), { target: { value: "old123" } });
        fireEvent.change(screen.getByLabelText("auth.newPassword"), { target: { value: "NewPass1!" } });
        fireEvent.change(screen.getByLabelText("auth.confirmPassword"), { target: { value: "NewPass1!" } });

        const captchaInput = await waitFor(() => screen.getByTestId("captcha-input"));
        fireEvent.change(captchaInput, { target: { value: "answer" } });

        await act(async () => {
            fireEvent.submit(screen.getByText("auth.changePasswordButton"));
        });

        await waitFor(() => {
            expect(mockChangePassword).toHaveBeenCalledWith(
                expect.objectContaining({
                    oldPassword: "old123",
                    newPassword: "NewPass1!",
                    recaptchaToken: "recaptcha-token-123",
                }),
            );
        });
    });

    it("shows success message after successful password change", async () => {
        mockValidateCaptcha.mockResolvedValue({ success: true });
        mockChangePassword.mockResolvedValue({ success: true });

        (window as Record<string, unknown>).grecaptcha = {
            ready: (cb: () => void) => cb(),
            execute: vi.fn().mockResolvedValue("token"),
        };

        renderPage();

        fireEvent.change(screen.getByLabelText("auth.currentPassword"), { target: { value: "old" } });
        fireEvent.change(screen.getByLabelText("auth.newPassword"), { target: { value: "NewPass1!" } });
        fireEvent.change(screen.getByLabelText("auth.confirmPassword"), { target: { value: "NewPass1!" } });

        const captchaInput = await waitFor(() => screen.getByTestId("captcha-input"));
        fireEvent.change(captchaInput, { target: { value: "ans" } });

        await act(async () => {
            fireEvent.submit(screen.getByText("auth.changePasswordButton"));
        });

        await waitFor(() => {
            expect(screen.getByText("auth.passwordChangeSuccess")).toBeInTheDocument();
        });
    });

    it("shows error when recaptcha is not available", async () => {
        mockValidateCaptcha.mockResolvedValue({ success: true });
        // No window.grecaptcha
        renderPage();

        fireEvent.change(screen.getByLabelText("auth.currentPassword"), { target: { value: "old" } });
        fireEvent.change(screen.getByLabelText("auth.newPassword"), { target: { value: "NewPass1!" } });
        fireEvent.change(screen.getByLabelText("auth.confirmPassword"), { target: { value: "NewPass1!" } });

        const captchaInput = await waitFor(() => screen.getByTestId("captcha-input"));
        fireEvent.change(captchaInput, { target: { value: "ans" } });

        await act(async () => {
            fireEvent.submit(screen.getByText("auth.changePasswordButton"));
        });

        await waitFor(() => {
            expect(screen.getByText("auth.recaptchaLoadError")).toBeInTheDocument();
        });
    });
});
