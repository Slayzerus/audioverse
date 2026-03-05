import { useEffect, useRef } from "react";
import { useGamepadNavigation } from "../contexts/GamepadNavigationContext";

/**
 * Hook that automatically pushes/pops a gamepad focus trap when a modal is shown/hidden.
 *
 * @param isOpen Whether the modal is currently visible
 * @param prefix  Focusable ID prefix scoped to this modal (e.g. "song-picker-")
 * @param options.onDismiss Called when the user presses the gamepad Back/Cancel button
 * @param options.initialActive  Focusable ID to activate when the trap opens (after 30 ms)
 */
export function useModalFocusTrap(
    isOpen: boolean,
    prefix: string,
    options?: {
        onDismiss?: () => void;
        initialActive?: string;
    },
) {
    const { pushFocusTrap, popFocusTrap, setActive } = useGamepadNavigation();
    const closingRef = useRef(false);
    const optionsRef = useRef(options);
    optionsRef.current = options;

    useEffect(() => {
        if (isOpen) {
            closingRef.current = false;
            pushFocusTrap(prefix, () => {
                if (closingRef.current) return;
                closingRef.current = true;
                optionsRef.current?.onDismiss?.();
            });

            if (optionsRef.current?.initialActive) {
                const t = setTimeout(() => setActive(optionsRef.current!.initialActive!), 30);
                return () => clearTimeout(t);
            }
        } else {
            if (!closingRef.current) {
                popFocusTrap();
            }
        }
    }, [isOpen, prefix, pushFocusTrap, popFocusTrap, setActive]);
}
