import React from "react";
import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

/* ── Shared mock state ────────────────────────────────────────────── */

const mockNavigate = vi.fn();
const mockLogout = vi.fn();
const mockShowToast = vi.fn();
const mockConfirm = vi.fn(() => Promise.resolve(false));
const mockResetTutorials = vi.fn();
const mockAddSession = vi.fn(() => Promise.resolve({ sessionId: 99 }));

let userState = {
    isAuthenticated: false,
    isAdmin: false,
    requirePasswordChange: false,
    userId: null as number | null,
    currentUser: null as { userId: number } | null,
    roles: [] as string[],
    systemConfig: null as Record<string, string> | null,
    login: vi.fn(),
    logout: mockLogout,
    refreshUser: vi.fn(),
};

/* ── Module mocks ─────────────────────────────────────────────────── */

vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return {
        ...(actual as object),
        useNavigate: () => mockNavigate,
    };
});

vi.mock("../contexts/UserContext", () => ({
    useUser: () => userState,
}));

vi.mock("../contexts/ThemeContext", () => ({
    useTheme: () => ({
        theme: "dark",
        themeDef: { isDark: true, colors: {} },
    }),
}));

vi.mock("../contexts/TutorialContext", () => ({
    useTutorial: () => ({ resetTutorials: mockResetTutorials }),
}));

vi.mock("../components/ui/ConfirmProvider", () => ({
    useConfirm: () => mockConfirm,
}));

vi.mock("../components/ui/ToastProvider", () => ({
    useToast: () => ({ showToast: mockShowToast }),
}));

vi.mock("../scripts/api/apiKaraoke", () => ({
    useAddSessionMutation: () => ({ mutateAsync: mockAddSession }),
}));

vi.mock("react-i18next", () => ({
    useTranslation: () => ({
        t: (key: string) => key,
        i18n: { language: "en", changeLanguage: vi.fn() },
    }),
}));

// Stub sub-components that have their own dependencies
vi.mock("../components/common/ThemePicker", () => ({
    default: () => <div data-testid="theme-picker" />,
}));

vi.mock("../components/common/LanguageSwitcher", () => ({
    default: () => <div data-testid="language-switcher" />,
}));

vi.mock("../components/common/NotificationBell", () => ({
    default: () => <div data-testid="notification-bell" />,
}));

vi.mock("../components/common/Focusable", () => ({
    Focusable: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
        <div onClick={onClick}>{children}</div>
    ),
}));

vi.mock("../contexts/GamepadNavigationContext", () => ({
    useGamepadNavigation: () => ({
        pushFocusTrap: vi.fn(),
        popFocusTrap: vi.fn(),
        registerFocusable: vi.fn(),
        unregisterFocusable: vi.fn(),
        setFocused: vi.fn(),
        focusedId: null,
        isGamepadActive: false,
    }),
}));

/* ── Import component under test ─────────────────────────────────── */
import AppNavbar from "../components/Navbar";

/* ── Helpers ──────────────────────────────────────────────────────── */

const renderNavbar = (path = "/") =>
    render(
        <MemoryRouter initialEntries={[path]}>
            <AppNavbar />
        </MemoryRouter>,
    );

/* ── Setup ────────────────────────────────────────────────────────── */

beforeEach(() => {
    vi.clearAllMocks();
    userState = {
        isAuthenticated: false,
        isAdmin: false,
        requirePasswordChange: false,
        userId: null,
        currentUser: null,
        roles: [],
        systemConfig: null,
        login: vi.fn(),
        logout: mockLogout,
        refreshUser: vi.fn(),
    };
});

/* ── Tests ────────────────────────────────────────────────────────── */

describe("Navbar", () => {
    describe("always-visible elements", () => {
        it("renders brand link to /", () => {
            renderNavbar();
            // Brand is "Audio" + "Verse" in separate spans
            expect(screen.getByText("Audio")).toBeTruthy();
            expect(screen.getByText("Verse")).toBeTruthy();
            const brandLink = screen.getByText("Audio").closest("a");
            expect(brandLink?.getAttribute("href")).toBe("/");
        });

        it("has navigation role with aria-label", () => {
            renderNavbar();
            const nav = screen.getByRole("navigation");
            expect(nav).toBeTruthy();
            expect(nav.getAttribute("aria-label")).toBeTruthy();
        });

        it("renders theme picker and language switcher", () => {
            renderNavbar();
            expect(screen.getByTestId("theme-picker")).toBeTruthy();
            expect(screen.getByTestId("language-switcher")).toBeTruthy();
        });
    });

    describe("unauthenticated state", () => {
        it("shows sign in and sign up links", () => {
            renderNavbar();
            // i18n keys are returned as-is
            expect(screen.getByText("nav.signIn")).toBeTruthy();
            expect(screen.getByText("nav.signUp")).toBeTruthy();
        });

        it("does not show sign out button", () => {
            renderNavbar();
            expect(screen.queryByText("nav.signOut")).toBeNull();
        });
    });

    describe("authenticated state", () => {
        beforeEach(() => {
            userState.isAuthenticated = true;
            userState.userId = 42;
            userState.currentUser = { userId: 42 };
        });

        it("shows sign out button", () => {
            renderNavbar();
            expect(screen.getByText("nav.signOut")).toBeTruthy();
        });

        it("does not show sign in / sign up links", () => {
            renderNavbar();
            expect(screen.queryByText("nav.signIn")).toBeNull();
            expect(screen.queryByText("nav.signUp")).toBeNull();
        });

        it("sign out calls logout and navigates to /login", () => {
            renderNavbar();
            const signOutBtn = screen.getByText("nav.signOut");
            fireEvent.click(signOutBtn);
            expect(mockLogout).toHaveBeenCalled();
            expect(mockNavigate).toHaveBeenCalledWith("/login");
        });
    });

    describe("admin state", () => {
        beforeEach(() => {
            userState.isAuthenticated = true;
            userState.isAdmin = true;
            userState.userId = 1;
            userState.currentUser = { userId: 1 };
            userState.roles = ["admin"];
        });

        it("shows admin dropdown when user is admin", () => {
            renderNavbar();
            // The admin dropdown title uses i18n key
            expect(screen.getByText("nav.admin")).toBeTruthy();
        });
    });

    describe("password change required", () => {
        beforeEach(() => {
            userState.isAuthenticated = true;
            userState.requirePasswordChange = true;
            userState.userId = 1;
            userState.currentUser = { userId: 1 };
        });

        it("hides nav dropdowns when password change is required", () => {
            renderNavbar();
            // Should still show sign out
            expect(screen.getByText("nav.signOut")).toBeTruthy();
            // But music/games/create dropdowns should be hidden
            expect(screen.queryByText("nav.music")).toBeNull();
            expect(screen.queryByText("nav.games")).toBeNull();
        });
    });
});
