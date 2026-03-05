import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";

/* ── Mock UserContext ─────────────────────────────────────────────── */

const mockUseUser = vi.fn(() => ({
    isAuthenticated: false,
    isAdmin: false,
    currentUser: null,
    login: vi.fn(),
    logout: vi.fn(),
    refreshUser: vi.fn(),
}));

vi.mock("../contexts/UserContext", () => ({
    useUser: () => mockUseUser(),
}));

vi.mock("../components/common/HelpButton", () => ({
    default: () => null,
}));

/* ── Layouts under test ──────────────────────────────────────────── */

import AuthLayout from "../layouts/AuthLayout";
import AdminLayout from "../layouts/AdminLayout";
import RootLayout from "../layouts/RootLayout";

/* Suppress console.error from router warnings */
beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
});

/* ── Helper: render with memory router ────────────────────────────── */

function renderWithRouter(
    routes: Parameters<typeof createMemoryRouter>[0],
    initialPath = "/",
) {
    const router = createMemoryRouter(routes, {
        initialEntries: [initialPath],
    });
    return render(<RouterProvider router={router} />);
}

/* ── AuthLayout tests ─────────────────────────────────────────────── */

describe("AuthLayout", () => {
    it("renders child route when authenticated", () => {
        mockUseUser.mockReturnValue({
            isAuthenticated: true,
            isAdmin: false,
            currentUser: { userId: 1 },
            login: vi.fn(),
            logout: vi.fn(),
            refreshUser: vi.fn(),
        });

        renderWithRouter([
            {
                element: <AuthLayout />,
                children: [
                    { path: "/protected", element: <p>Secret Content</p> },
                ],
            },
        ], "/protected");

        expect(screen.getByText("Secret Content")).toBeTruthy();
    });

    it("redirects to /login when not authenticated", () => {
        mockUseUser.mockReturnValue({
            isAuthenticated: false,
            isAdmin: false,
            currentUser: null,
            login: vi.fn(),
            logout: vi.fn(),
            refreshUser: vi.fn(),
        });

        renderWithRouter([
            {
                element: <AuthLayout />,
                children: [
                    { path: "/protected", element: <p>Secret Content</p> },
                ],
            },
            { path: "/login", element: <p>Login Page</p> },
        ], "/protected");

        expect(screen.queryByText("Secret Content")).toBeNull();
        expect(screen.getByText("Login Page")).toBeTruthy();
    });
});

/* ── AdminLayout tests ────────────────────────────────────────────── */

describe("AdminLayout", () => {
    it("renders child route when user is admin", () => {
        mockUseUser.mockReturnValue({
            isAuthenticated: true,
            isAdmin: true,
            currentUser: { userId: 1 },
            login: vi.fn(),
            logout: vi.fn(),
            refreshUser: vi.fn(),
        });

        renderWithRouter([
            {
                element: <AdminLayout />,
                children: [
                    { path: "/admin", element: <p>Admin Dashboard</p> },
                ],
            },
        ], "/admin");

        expect(screen.getByText("Admin Dashboard")).toBeTruthy();
    });

    it("redirects to /login when not authenticated", () => {
        mockUseUser.mockReturnValue({
            isAuthenticated: false,
            isAdmin: false,
            currentUser: null,
            login: vi.fn(),
            logout: vi.fn(),
            refreshUser: vi.fn(),
        });

        renderWithRouter([
            {
                element: <AdminLayout />,
                children: [
                    { path: "/admin", element: <p>Admin Dashboard</p> },
                ],
            },
            { path: "/login", element: <p>Login Page</p> },
        ], "/admin");

        expect(screen.queryByText("Admin Dashboard")).toBeNull();
        expect(screen.getByText("Login Page")).toBeTruthy();
    });

    it("redirects to / when authenticated but not admin", () => {
        mockUseUser.mockReturnValue({
            isAuthenticated: true,
            isAdmin: false,
            currentUser: { userId: 1 },
            login: vi.fn(),
            logout: vi.fn(),
            refreshUser: vi.fn(),
        });

        renderWithRouter([
            {
                element: <AdminLayout />,
                children: [
                    { path: "/admin", element: <p>Admin Dashboard</p> },
                ],
            },
            { path: "/", element: <p>Home Page</p> },
        ], "/admin");

        expect(screen.queryByText("Admin Dashboard")).toBeNull();
        expect(screen.getByText("Home Page")).toBeTruthy();
    });
});

/* ── RootLayout tests ─────────────────────────────────────────────── */

describe("RootLayout", () => {
    // Mock components used by RootLayout
    vi.mock("../components/Navbar", () => ({
        default: () => <nav data-testid="navbar">Navbar</nav>,
    }));
    vi.mock("../components/common/TutorialOverlay", () => ({
        default: () => null,
    }));
    vi.mock("../components/common/ScrollToTop", () => ({
        default: () => null,
    }));
    vi.mock("../components/common/PageSpinner", () => ({
        default: () => <div data-testid="spinner">Loading...</div>,
    }));
    vi.mock("../components/common/ErrorBoundary", () => ({
        default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    }));
    vi.mock("../components/GamepadBar", () => ({
        default: () => null,
    }));
    vi.mock("../components/NoteRiver", () => ({
        default: () => null,
    }));
    vi.mock("../components/NoteParticles", () => ({
        default: () => null,
    }));

    it("renders navbar and child route content", () => {
        renderWithRouter([
            {
                element: <RootLayout />,
                children: [
                    { path: "/", element: <p>Home Content</p> },
                ],
            },
        ]);

        expect(screen.getByTestId("navbar")).toBeTruthy();
        expect(screen.getByText("Home Content")).toBeTruthy();
    });

    it("renders skip-to-content link for a11y", () => {
        renderWithRouter([
            {
                element: <RootLayout />,
                children: [
                    { path: "/", element: <p>Home</p> },
                ],
            },
        ]);

        const skipLink = screen.getByText("Skip to main content");
        expect(skipLink).toBeTruthy();
        expect(skipLink.getAttribute("href")).toBe("#main-content");
    });

    it("renders main landmark with correct attributes", () => {
        renderWithRouter([
            {
                element: <RootLayout />,
                children: [
                    { path: "/", element: <p>Home</p> },
                ],
            },
        ]);

        const main = screen.getByRole("main");
        expect(main).toBeTruthy();
        expect(main.getAttribute("aria-label")).toBe("Main content");
    });
});
