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

const mockLogin = vi.fn();
vi.mock("../contexts/UserContext", () => ({
    useUser: () => ({
        login: mockLogin,
        systemConfig: { captchaOption: 2 },
    }),
}));

const mockLoginUser = vi.fn();
vi.mock("../scripts/api/apiUser", () => ({
    default: { loginUser: (...args: unknown[]) => mockLoginUser(...args) },
}));

vi.mock("../services/authService", () => ({
    generateCaptcha: vi.fn(),
}));

vi.mock("react-i18next", () => ({
    useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock("@fortawesome/react-fontawesome", () => ({
    FontAwesomeIcon: () => <span data-testid="fa-icon" />,
}));

vi.mock("../components/common/Focusable", () => ({
    Focusable: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("../components/auth/CaptchaComponent", () => ({
    default: () => <div data-testid="captcha" />,
}));

import LoginForm from "../components/forms/user/LoginForm";

// ── Helpers ───────────────────────────────────────────────────

function renderLoginForm() {
    return render(
        <MemoryRouter>
            <LoginForm />
        </MemoryRouter>,
    );
}

describe("LoginForm", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders username and password inputs and submit button", () => {
        renderLoginForm();
        expect(screen.getByPlaceholderText("auth.username")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("auth.password")).toBeInTheDocument();
        expect(screen.getByText("auth.loginButton")).toBeInTheDocument();
    });

    it("calls loginUser with entered credentials on submit", async () => {
        mockLoginUser.mockResolvedValue({ success: true });
        mockLogin.mockResolvedValue(undefined);
        renderLoginForm();

        fireEvent.change(screen.getByPlaceholderText("auth.username"), { target: { value: "admin", name: "username" } });
        fireEvent.change(screen.getByPlaceholderText("auth.password"), { target: { value: "pass123", name: "password" } });
        await act(async () => {
            fireEvent.submit(screen.getByText("auth.loginButton"));
        });

        expect(mockLoginUser).toHaveBeenCalledWith({ username: "admin", password: "pass123" });
    });

    it("navigates to / on successful login", async () => {
        mockLoginUser.mockResolvedValue({ success: true });
        mockLogin.mockResolvedValue(undefined);
        renderLoginForm();

        fireEvent.change(screen.getByPlaceholderText("auth.username"), { target: { value: "user1", name: "username" } });
        fireEvent.change(screen.getByPlaceholderText("auth.password"), { target: { value: "pw", name: "password" } });
        await act(async () => { fireEvent.submit(screen.getByText("auth.loginButton")); });

        expect(mockLogin).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith("/");
    });

    it("navigates to /profile/change-password when requirePasswordChange is true", async () => {
        mockLoginUser.mockResolvedValue({ success: true, requirePasswordChange: true });
        mockLogin.mockResolvedValue(undefined);
        renderLoginForm();

        fireEvent.change(screen.getByPlaceholderText("auth.username"), { target: { value: "user1", name: "username" } });
        fireEvent.change(screen.getByPlaceholderText("auth.password"), { target: { value: "pw", name: "password" } });
        await act(async () => { fireEvent.submit(screen.getByText("auth.loginButton")); });

        expect(mockNavigate).toHaveBeenCalledWith("/profile/change-password");
    });

    it("shows error message when login fails", async () => {
        mockLoginUser.mockResolvedValue({ success: false, errorMessage: "Invalid credentials" });
        renderLoginForm();

        fireEvent.change(screen.getByPlaceholderText("auth.username"), { target: { value: "bad", name: "username" } });
        fireEvent.change(screen.getByPlaceholderText("auth.password"), { target: { value: "wrong", name: "password" } });
        await act(async () => { fireEvent.submit(screen.getByText("auth.loginButton")); });

        expect(screen.getByRole("alert")).toHaveTextContent("Invalid credentials");
        expect(mockLogin).not.toHaveBeenCalled();
        expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("shows fallback error message when errorMessage is absent", async () => {
        mockLoginUser.mockResolvedValue({ success: false });
        renderLoginForm();

        fireEvent.change(screen.getByPlaceholderText("auth.username"), { target: { value: "u", name: "username" } });
        fireEvent.change(screen.getByPlaceholderText("auth.password"), { target: { value: "p", name: "password" } });
        await act(async () => { fireEvent.submit(screen.getByText("auth.loginButton")); });

        expect(screen.getByRole("alert")).toHaveTextContent("auth.loginError");
    });

    it("shows error when loginUser throws", async () => {
        mockLoginUser.mockRejectedValue(new Error("Network error"));
        renderLoginForm();

        fireEvent.change(screen.getByPlaceholderText("auth.username"), { target: { value: "u", name: "username" } });
        fireEvent.change(screen.getByPlaceholderText("auth.password"), { target: { value: "p", name: "password" } });
        await act(async () => { fireEvent.submit(screen.getByText("auth.loginButton")); });

        await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Network error"));
    });
});
