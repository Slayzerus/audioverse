import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi, describe, it, expect, beforeEach } from "vitest";

// ── Mocks ─────────────────────────────────────────────────────

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
    return { ...actual, useNavigate: () => mockNavigate };
});

const mockRegisterUser = vi.fn();
vi.mock("../scripts/api/apiUser", () => ({
    default: { registerUser: (...args: unknown[]) => mockRegisterUser(...args) },
}));

const mockGetPasswordRequirements = vi.fn();
vi.mock("../scripts/api/apiAdmin", () => ({
    default: { getPasswordRequirements: () => mockGetPasswordRequirements() },
}));

vi.mock("../services/authService", () => ({
    generateCaptcha: vi.fn(),
}));

vi.mock("react-i18next", () => ({
    useTranslation: () => ({ t: (key: string, fallback?: string) => fallback ?? key }),
}));

vi.mock("@fortawesome/react-fontawesome", () => ({
    FontAwesomeIcon: () => <span data-testid="fa-icon" />,
}));

vi.mock("../components/auth/PasswordStrengthIndicator", () => ({
    default: ({ rules }: { rules: { label: string; valid: boolean }[] }) => (
        <ul data-testid="pw-rules">
            {rules.map((r, i) => (
                <li key={i} data-valid={r.valid}>{r.label}</li>
            ))}
        </ul>
    ),
}));

import RegistrationForm from "../components/forms/user/RegistrationForm";

// ── Helpers ───────────────────────────────────────────────────

function renderForm() {
    return render(
        <MemoryRouter>
            <RegistrationForm />
        </MemoryRouter>,
    );
}

describe("RegistrationForm", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Return default password requirements from backend
        mockGetPasswordRequirements.mockResolvedValue({
            requirements: [
                {
                    minLength: 8,
                    maxLength: 128,
                    requireUppercase: true,
                    requireLowercase: true,
                    requireDigit: true,
                    requireSpecialChar: true,
                    active: true,
                },
            ],
        });
    });

    it("renders username, email, password inputs and submit button", async () => {
        renderForm();
        expect(screen.getByPlaceholderText("auth.username")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Email")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("auth.password")).toBeInTheDocument();
        expect(screen.getByText("auth.registerButton")).toBeInTheDocument();
    });

    it("disables submit when password rules are not met", async () => {
        renderForm();
        // Default password is empty — rules not satisfied
        await waitFor(() => {
            expect(screen.getByText("auth.registerButton")).toBeDisabled();
        });
    });

    it("enables submit when password meets all rules", async () => {
        renderForm();

        fireEvent.change(screen.getByPlaceholderText("auth.username"), { target: { value: "testuser", name: "username" } });
        fireEvent.change(screen.getByPlaceholderText("Email"), { target: { value: "test@test.com", name: "email" } });
        fireEvent.change(screen.getByPlaceholderText("auth.password"), { target: { value: "StrongP@ss1", name: "password" } });

        await waitFor(() => {
            expect(screen.getByText("auth.registerButton")).not.toBeDisabled();
        });
    });

    it("calls registerUser and shows success message on submit", async () => {
        mockRegisterUser.mockResolvedValue({ success: true });
        renderForm();

        fireEvent.change(screen.getByPlaceholderText("auth.username"), { target: { value: "newuser", name: "username" } });
        fireEvent.change(screen.getByPlaceholderText("Email"), { target: { value: "new@test.com", name: "email" } });
        fireEvent.change(screen.getByPlaceholderText("auth.password"), { target: { value: "Abcde@123", name: "password" } });

        await act(async () => {
            fireEvent.submit(screen.getByText("auth.registerButton"));
        });

        expect(mockRegisterUser).toHaveBeenCalledWith(
            expect.objectContaining({
                username: "newuser",
                email: "new@test.com",
                password: "Abcde@123",
            }),
        );
        expect(screen.getByText("auth.registerSuccess")).toBeInTheDocument();
    });

    it("shows error when registerUser throws", async () => {
        mockRegisterUser.mockRejectedValue(new Error("Username taken"));
        renderForm();

        fireEvent.change(screen.getByPlaceholderText("auth.username"), { target: { value: "dup", name: "username" } });
        fireEvent.change(screen.getByPlaceholderText("Email"), { target: { value: "dup@test.com", name: "email" } });
        fireEvent.change(screen.getByPlaceholderText("auth.password"), { target: { value: "Abcde@123", name: "password" } });

        await act(async () => {
            fireEvent.submit(screen.getByText("auth.registerButton"));
        });

        await waitFor(() => {
            expect(screen.getByText("Username taken")).toBeInTheDocument();
        });
    });

    it("renders password strength indicator", async () => {
        renderForm();
        await waitFor(() => {
            expect(screen.getByTestId("pw-rules")).toBeInTheDocument();
        });
    });

    it("uses default rules when backend returns empty array", async () => {
        mockGetPasswordRequirements.mockResolvedValue([]);
        renderForm();
        await waitFor(() => {
            const ruleItems = screen.getByTestId("pw-rules").querySelectorAll("li");
            // Default fallback: 5 rules (minLen, upper, lower, digit, special)
            expect(ruleItems.length).toBe(5);
        });
    });
});
