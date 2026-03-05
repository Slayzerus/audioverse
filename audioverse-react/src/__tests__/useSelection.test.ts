import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSelection } from "../hooks/useSelection";

describe("useSelection", () => {
    it("starts with empty selection", () => {
        const { result } = renderHook(() => useSelection());
        expect(result.current.map).toEqual({});
    });

    it("toggle adds a key", () => {
        const { result } = renderHook(() => useSelection());

        act(() => result.current.toggle("a"));

        expect(result.current.map).toEqual({ a: true });
    });

    it("toggle twice removes a key", () => {
        const { result } = renderHook(() => useSelection());

        act(() => result.current.toggle("a"));
        act(() => result.current.toggle("a"));

        expect(result.current.map.a).toBe(false);
    });

    it("multiple toggles track independently", () => {
        const { result } = renderHook(() => useSelection());

        act(() => result.current.toggle("a"));
        act(() => result.current.toggle("b"));

        expect(result.current.map).toEqual({ a: true, b: true });

        act(() => result.current.toggle("a"));
        expect(result.current.map).toEqual({ a: false, b: true });
    });

    it("set replaces the entire map", () => {
        const { result } = renderHook(() => useSelection());

        act(() => result.current.toggle("a"));
        act(() => result.current.set({ x: true, y: true }));

        expect(result.current.map).toEqual({ x: true, y: true });
    });

    it("clear resets to empty", () => {
        const { result } = renderHook(() => useSelection());

        act(() => result.current.toggle("a"));
        act(() => result.current.toggle("b"));
        act(() => result.current.clear());

        expect(result.current.map).toEqual({});
    });

    it("returns stable callbacks across renders", () => {
        const { result, rerender } = renderHook(() => useSelection());

        const { toggle: t1, set: s1, clear: c1 } = result.current;
        rerender();
        const { toggle: t2, set: s2, clear: c2 } = result.current;

        expect(t1).toBe(t2);
        expect(s1).toBe(s2);
        expect(c1).toBe(c2);
    });
});
