import { useEffect } from "react";
import { useGamepadNavigation } from "../contexts/GamepadNavigationContext";

/**
 * Suppresses all global keyboard/gamepad navigation while the component is mounted.
 * Use this in any game component to prevent arrow keys from moving navbar focus,
 * Enter from opening dropdowns, etc.
 *
 * For games that also need a focus-trap prefix, use `useMiniGameFocusTrap` instead
 * (which also calls enterGameMode/exitGameMode internally).
 */
export function useGameFocusLock() {
  const { enterGameMode, exitGameMode } = useGamepadNavigation();

  useEffect(() => {
    enterGameMode();
    return () => exitGameMode();
  }, [enterGameMode, exitGameMode]);
}
