import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import PlayPage from "../pages/play/PlayPage";

/* ── Mock i18n to return the key as text ─────────────────────── */
vi.mock("react-i18next", () => ({
    useTranslation: () => ({
        t: (key: string) => key,
        i18n: { language: "en" },
    }),
}));

vi.mock('../contexts/GamepadNavigationContext', () => ({
    useGamepadNavigation: () => ({ register: () => () => {}, unregister: () => {}, activeId: null, setActive: () => {}, pushFocusTrap: () => {}, popFocusTrap: () => {} }),
    GamepadNavigationProvider: ({ children }: any) => children,
}));

/* ── Helper ──────────────────────────────────────────────────── */
const renderPage = () =>
    render(
        <MemoryRouter>
            <PlayPage />
        </MemoryRouter>,
    );

/* ── Tests ───────────────────────────────────────────────────── */
describe("PlayPage", () => {
    it("renders heading with play hub text", () => {
        renderPage();
        expect(screen.getByText("nav.play")).toBeInTheDocument();
        expect(screen.getByText("playHub.hub")).toBeInTheDocument();
    });

    it("renders subtitle", () => {
        renderPage();
        expect(screen.getByText("playHub.subtitle")).toBeInTheDocument();
    });

    it("renders all 10 card links", () => {
        renderPage();
        const links = screen.getAllByRole("link");
        expect(links).toHaveLength(10);
    });

    it("each card has correct href", () => {
        renderPage();
        const expectedPaths = [
            "/parties", "/join", "/songs", "/rounds",
            "/karaoke-playlists", "/dance", "/hit-that-note", "/mini-games/song",
            "/jam-session", "/features",
        ];
        const links = screen.getAllByRole("link");
        const hrefs = links.map((l) => l.getAttribute("href"));
        expect(hrefs).toEqual(expectedPaths);
    });

    it("cards display icons", () => {
        renderPage();
        const expectedIcons = ["🎉", "📱", "🎵", "🎤", "📋", "💃", "🎯", "🧩", "🥁", "⭐"];
        for (const icon of expectedIcons) {
            expect(screen.getByText(icon)).toBeInTheDocument();
        }
    });

    it("cards display translated titles", () => {
        renderPage();
        const cardIds = [
            "parties", "join", "songs", "rounds",
            "karaokePlaylists", "dance", "hitThatNote", "songMiniGames",
            "jamSession", "features",
        ];
        for (const id of cardIds) {
            expect(screen.getByText(`playHub.cards.${id}.title`)).toBeInTheDocument();
        }
    });
});
