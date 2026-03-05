import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider, useTheme } from "../contexts/ThemeContext";

/* ── Mock theme catalog ──────────────────────────────────────────── */

const darkTheme = {
    id: "midnight",
    name: "Midnight",
    emoji: "🌙",
    isDark: true,
    vars: { "--bg-primary": "#111" },
};

const lightTheme = {
    id: "daylight",
    name: "Daylight",
    emoji: "☀️",
    isDark: false,
    vars: { "--bg-primary": "#fff" },
};

vi.mock("../themes", () => ({
    ALL_THEMES: [
        { id: "midnight", name: "Midnight", emoji: "🌙", isDark: true, vars: { "--bg-primary": "#111" } },
        { id: "daylight", name: "Daylight", emoji: "☀️", isDark: false, vars: { "--bg-primary": "#fff" } },
    ],
    DEFAULT_THEME_ID: "midnight",
    THEME_MAP: {
        midnight: { id: "midnight", name: "Midnight", emoji: "🌙", isDark: true, vars: { "--bg-primary": "#111" } },
        daylight: { id: "daylight", name: "Daylight", emoji: "☀️", isDark: false, vars: { "--bg-primary": "#fff" } },
    },
    loadThemeCatalog: () => [
        { id: "midnight", name: "Midnight", emoji: "🌙", isDark: true, vars: { "--bg-primary": "#111" } },
        { id: "daylight", name: "Daylight", emoji: "☀️", isDark: false, vars: { "--bg-primary": "#fff" } },
    ],
}));

/* ── Helper consumer component ───────────────────────────────────── */

const ThemeConsumer: React.FC = () => {
    const { themeId, theme, themeDef, toggleTheme, setThemeById, availableThemes } = useTheme();
    return (
        <div>
            <span data-testid="theme-id">{themeId}</span>
            <span data-testid="theme-legacy">{theme}</span>
            <span data-testid="theme-dark">{String(themeDef.isDark)}</span>
            <span data-testid="available-count">{availableThemes.length}</span>
            <button onClick={toggleTheme}>Toggle</button>
            <button onClick={() => setThemeById("daylight")}>Set Light</button>
        </div>
    );
};

/* ── Tests ────────────────────────────────────────────────────────── */

describe("ThemeContext", () => {
    beforeEach(() => {
        localStorage.removeItem("audioverse-theme-id");
        localStorage.removeItem("app-theme");
        document.documentElement.removeAttribute("data-theme");
        document.documentElement.removeAttribute("data-skin");
    });

    it("provides default dark theme", () => {
        render(
            <ThemeProvider>
                <ThemeConsumer />
            </ThemeProvider>,
        );
        expect(screen.getByTestId("theme-id").textContent).toBe("midnight");
        expect(screen.getByTestId("theme-legacy").textContent).toBe("dark");
        expect(screen.getByTestId("theme-dark").textContent).toBe("true");
    });

    it("lists available themes", () => {
        render(
            <ThemeProvider>
                <ThemeConsumer />
            </ThemeProvider>,
        );
        expect(screen.getByTestId("available-count").textContent).toBe("2");
    });

    it("toggleTheme switches dark → light", async () => {
        const user = userEvent.setup();
        render(
            <ThemeProvider>
                <ThemeConsumer />
            </ThemeProvider>,
        );
        expect(screen.getByTestId("theme-id").textContent).toBe("midnight");

        await user.click(screen.getByText("Toggle"));

        expect(screen.getByTestId("theme-id").textContent).toBe("daylight");
        expect(screen.getByTestId("theme-legacy").textContent).toBe("light");
    });

    it("setThemeById changes theme", async () => {
        const user = userEvent.setup();
        render(
            <ThemeProvider>
                <ThemeConsumer />
            </ThemeProvider>,
        );

        await user.click(screen.getByText("Set Light"));

        expect(screen.getByTestId("theme-id").textContent).toBe("daylight");
    });

    it("persists theme to localStorage", async () => {
        const user = userEvent.setup();
        render(
            <ThemeProvider>
                <ThemeConsumer />
            </ThemeProvider>,
        );

        await user.click(screen.getByText("Set Light"));

        expect(localStorage.getItem("audioverse-theme-id")).toBe("daylight");
    });

    it("applies data-theme attribute to DOM", () => {
        // Clean DOM state from previous tests
        document.documentElement.removeAttribute("data-theme");
        document.documentElement.removeAttribute("data-skin");
        render(
            <ThemeProvider>
                <ThemeConsumer />
            </ThemeProvider>,
        );
        // Default theme is midnight (dark)
        expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    });

    it("throws when useTheme is called outside provider", () => {
        const ErrorConsumer: React.FC = () => {
            useTheme();
            return null;
        };
        expect(() => render(<ErrorConsumer />)).toThrow("useTheme must be used within ThemeProvider");
    });
});
