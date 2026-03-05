import { useEffect, useRef } from "react";
import { useGamepadNavigation } from "../contexts/GamepadNavigationContext";

/**
 * Hook that traps gamepad/keyboard focus within a mini-game while active.
 * Locks navigation to elements with the given prefix (e.g. "battlefield-").
 * Also enters game mode to suppress ALL global keyboard/gamepad navigation,
 * ensuring arrow keys, Enter, Space, and gamepad buttons are owned by the game.
 * Pops the trap on unmount or when the game exits.
 *
 * @param isActive Whether the mini-game is currently active (mounted)
 * @param prefix  Focusable ID prefix for the mini-game (e.g. "battlefield-")
 */
export function useMiniGameFocusTrap(isActive: boolean, prefix: string) {
  const { pushFocusTrap, popFocusTrap, enterGameMode, exitGameMode } = useGamepadNavigation();
  const trapActive = useRef(false);

  useEffect(() => {
    if (isActive) {
      trapActive.current = true;
      pushFocusTrap(prefix);
      enterGameMode();
    } else if (trapActive.current) {
      exitGameMode();
      popFocusTrap();
      trapActive.current = false;
    }
    return () => {
      if (trapActive.current) {
        exitGameMode();
        popFocusTrap();
        trapActive.current = false;
      }
    };
  }, [isActive, prefix, enterGameMode, exitGameMode, pushFocusTrap, popFocusTrap]);
}
