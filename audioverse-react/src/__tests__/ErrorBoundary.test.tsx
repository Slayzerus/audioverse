import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "../i18n/i18n"; // initialize i18n so ErrorBoundary translations resolve
import i18n from "../i18n/i18n";
import ErrorBoundary from "../components/common/ErrorBoundary";

/* ── helpers ──────────────────────────────────────────────────────── */

const ThrowingChild = ({ shouldThrow }: { shouldThrow: boolean }) => {
    if (shouldThrow) throw new Error("boom");
    return <p>OK</p>;
};

/* suppress noisy console.error from React + our boundary */
beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    // Use English language for consistent assertions (fallback, always loaded synchronously)
    i18n.changeLanguage("en");
});

/* ── tests ────────────────────────────────────────────────────────── */

describe("ErrorBoundary", () => {
    it("renders children when there is no error", () => {
        render(
            <ErrorBoundary>
                <p>hello</p>
            </ErrorBoundary>,
        );
        expect(screen.getByText("hello")).toBeTruthy();
    });

    it("shows fallback UI on render error", () => {
        render(
            <ErrorBoundary>
                <ThrowingChild shouldThrow />
            </ErrorBoundary>,
        );
        expect(screen.getByText(/Something went wrong/)).toBeTruthy();
        expect(screen.getByText("boom")).toBeTruthy();
    });

    it("recovers when 'Try again' is clicked", () => {
        let shouldThrow = true;
        const Child = () => {
            if (shouldThrow) throw new Error("boom");
            return <p>OK</p>;
        };

        render(
            <ErrorBoundary>
                <Child />
            </ErrorBoundary>,
        );
        expect(screen.getByText(/Something went wrong/)).toBeTruthy();

        /* stop child from throwing, then click reset */
        shouldThrow = false;
        fireEvent.click(screen.getByText("Try again"));

        expect(screen.getByText("OK")).toBeTruthy();
    });

    it("uses custom fallback when provided", () => {
        const customFallback = (error: Error, reset: () => void) => (
            <div>
                <span>custom: {error.message}</span>
                <button onClick={reset}>reset</button>
            </div>
        );

        render(
            <ErrorBoundary fallback={customFallback}>
                <ThrowingChild shouldThrow />
            </ErrorBoundary>,
        );
        expect(screen.getByText("custom: boom")).toBeTruthy();
    });

    it("navigates to / when 'Go to home page' is clicked", () => {
        // mock location
        const original = window.location.href;
        Object.defineProperty(window, "location", {
            writable: true,
            value: { href: "/current" },
        });

        render(
            <ErrorBoundary>
                <ThrowingChild shouldThrow />
            </ErrorBoundary>,
        );
        fireEvent.click(screen.getByText("Go to home page"));
        expect(window.location.href).toBe("/");

        // restore
        Object.defineProperty(window, "location", {
            writable: true,
            value: { href: original },
        });
    });
});
