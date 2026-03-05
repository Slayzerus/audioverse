import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useServiceWorker } from "../hooks/useServiceWorker";

describe("useServiceWorker", () => {
    beforeEach(() => {
        // Reset navigator.onLine
        Object.defineProperty(navigator, "onLine", { value: true, writable: true, configurable: true });
    });

    it("detects online state", () => {
        const { result } = renderHook(() => useServiceWorker());
        expect(result.current.isOffline).toBe(false);
    });

    it("detects offline state", () => {
        Object.defineProperty(navigator, "onLine", { value: false, writable: true, configurable: true });

        const { result } = renderHook(() => useServiceWorker());
        expect(result.current.isOffline).toBe(true);
    });

    it("updates when going offline", () => {
        const { result } = renderHook(() => useServiceWorker());
        expect(result.current.isOffline).toBe(false);

        act(() => {
            Object.defineProperty(navigator, "onLine", { value: false, writable: true, configurable: true });
            window.dispatchEvent(new Event("offline"));
        });

        expect(result.current.isOffline).toBe(true);
    });

    it("updates when going back online", () => {
        Object.defineProperty(navigator, "onLine", { value: false, writable: true, configurable: true });

        const { result } = renderHook(() => useServiceWorker());
        expect(result.current.isOffline).toBe(true);

        act(() => {
            Object.defineProperty(navigator, "onLine", { value: true, writable: true, configurable: true });
            window.dispatchEvent(new Event("online"));
        });

        expect(result.current.isOffline).toBe(false);
    });

    it("starts with updateAvailable = false", () => {
        const { result } = renderHook(() => useServiceWorker());
        expect(result.current.updateAvailable).toBe(false);
    });

    it("applyUpdate is a function", () => {
        const { result } = renderHook(() => useServiceWorker());
        expect(typeof result.current.applyUpdate).toBe("function");
    });

    it("cacheUrls is a function", () => {
        const { result } = renderHook(() => useServiceWorker());
        expect(typeof result.current.cacheUrls).toBe("function");
    });
});
