import { useState, useCallback, useRef, useEffect } from "react";
import { useGamepadNavigation } from "../contexts/GamepadNavigationContext";

/**
 * Custom hook encapsulating all navbar dropdown state management:
 * - Open/close state per dropdown id
 * - Delayed close on mouse leave (prevents closing when crossing gap)
 * - Gamepad toggle/close event listeners with cooldown
 * - Keyboard Enter/Space on dropdown triggers
 * - Auto-close when focus moves away
 */
export function useNavbarDropdowns() {
    const { setActive, activeId, focusables } = useGamepadNavigation();
    const [dropdownsOpen, setDropdownsOpen] = useState<{ [id: string]: boolean }>({});

    const setDropdownOpen = useCallback((id: string, open: boolean) => {
        setDropdownsOpen(prev => ({ ...prev, [id]: open }));
    }, []);

    // Delayed close for dropdowns (prevents closing when crossing the gap between trigger and menu)
    const closeTimeoutRef = useRef<{ [id: string]: ReturnType<typeof setTimeout> }>({});

    const handleDropdownMouseEnter = useCallback((id: string) => {
        if (closeTimeoutRef.current[id]) {
            clearTimeout(closeTimeoutRef.current[id]);
            delete closeTimeoutRef.current[id];
        }
        setDropdownsOpen(prev => {
            const updated: { [key: string]: boolean } = {};
            Object.keys(prev).forEach(key => {
                if (key !== id && prev[key]) {
                    updated[key] = false;
                    if (closeTimeoutRef.current[key]) {
                        clearTimeout(closeTimeoutRef.current[key]);
                        delete closeTimeoutRef.current[key];
                    }
                }
            });
            return { ...prev, ...updated, [id]: true };
        });
    }, []);

    const handleDropdownMouseLeave = useCallback((id: string) => {
        closeTimeoutRef.current[id] = setTimeout(() => {
            setDropdownOpen(id, false);
            delete closeTimeoutRef.current[id];
        }, 200);
    }, [setDropdownOpen]);

    // Gamepad toggle event with cooldown
    const lastDropdownToggleRef = useRef<{ [id: string]: number }>({});
    useEffect(() => {
        const cooldown = 600;
        const handler = (e: Event) => {
            const { id } = (e as CustomEvent<{ id: string }>).detail || {};
            if (!id) return;
            const now = Date.now();
            if (!lastDropdownToggleRef.current[id] || now - lastDropdownToggleRef.current[id] > cooldown) {
                setDropdownOpen(id, !dropdownsOpen[id]);
                lastDropdownToggleRef.current[id] = now;
            }
        };
        window.addEventListener("navbar-toggle-dropdown", handler as EventListener);
        return () => window.removeEventListener("navbar-toggle-dropdown", handler as EventListener);
    }, [dropdownsOpen, setDropdownOpen]);

    // Gamepad close-dropdown event (B button)
    useEffect(() => {
        const handler = (e: Event) => {
            const { id } = (e as CustomEvent<{ id: string }>).detail || {};
            if (id) setDropdownOpen(id, false);
        };
        window.addEventListener("navbar-close-dropdown", handler as EventListener);
        return () => window.removeEventListener("navbar-close-dropdown", handler as EventListener);
    }, [setDropdownOpen]);

    // Keyboard Enter/Space on dropdown triggers
    const lastKeyboardDropdownToggleRef = useRef<{ [id: string]: number }>({});
    useEffect(() => {
        if (!activeId) return;
        const meta = focusables.find(f => f.id === activeId);
        if (!meta?.isDropdown) return;
        const cooldown = 600;
        const handleKeyUp = (e: KeyboardEvent) => {
            if ((e.key === "Enter" || e.key === " ") && document.activeElement === meta.ref.current) {
                const now = Date.now();
                if (!lastKeyboardDropdownToggleRef.current[activeId] || now - lastKeyboardDropdownToggleRef.current[activeId] > cooldown) {
                    e.preventDefault();
                    setDropdownOpen(activeId, !dropdownsOpen[activeId]);
                    lastKeyboardDropdownToggleRef.current[activeId] = now;
                }
            }
        };
        window.addEventListener("keyup", handleKeyUp);
        return () => window.removeEventListener("keyup", handleKeyUp);
    }, [activeId, focusables, dropdownsOpen, setDropdownOpen]);

    // Auto-close dropdown when focus moves away (or is cleared entirely)
    useEffect(() => {
        setDropdownsOpen(prev => {
            const updated = { ...prev };
            Object.keys(updated).forEach(id => {
                // If activeId is empty / null, close all dropdowns
                if (!activeId) {
                    if (updated[id]) updated[id] = false;
                    return;
                }
                const isOnDropdownOrItem = activeId === id || activeId.startsWith(id + "-item-");
                if (!isOnDropdownOrItem && updated[id]) updated[id] = false;
            });
            return updated;
        });
    }, [activeId]);

    return {
        dropdownsOpen,
        setDropdownOpen,
        handleDropdownMouseEnter,
        handleDropdownMouseLeave,
        setActive,
        activeId,
        focusables,
    };
}
