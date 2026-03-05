import { syncSettingToBackend, loadUserSettings } from "../scripts/settingsSync";

export type GamepadMapping = {
  confirmButton: number;
  backButton: number;
  deadzone: number;
};

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export const defaultGamepadMapping: GamepadMapping = {
  confirmButton: 0, // A
  backButton: 1, // B
  deadzone: 0.25,
};

export function loadGamepadMapping(): GamepadMapping {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem("gamepadMapping") : null;
    if (!raw) return defaultGamepadMapping;
    const parsed = JSON.parse(raw) as Partial<GamepadMapping>;
    return {
      confirmButton: typeof parsed.confirmButton === "number" ? parsed.confirmButton : defaultGamepadMapping.confirmButton,
      backButton: typeof parsed.backButton === "number" ? parsed.backButton : defaultGamepadMapping.backButton,
      deadzone: typeof parsed.deadzone === "number" ? clamp(parsed.deadzone, 0, 1) : defaultGamepadMapping.deadzone,
    };
  } catch {
    /* Expected: localStorage or JSON.parse may fail */
    return defaultGamepadMapping;
  }
}

/** Hydrate from backend once */
let _gpadHydrated = false;
export async function hydrateGamepadMappingFromBackend(): Promise<void> {
  if (_gpadHydrated) return;
  _gpadHydrated = true;
  const s = await loadUserSettings();
  if (s?.gamepadMapping) {
    try {
      const remote = JSON.parse(s.gamepadMapping);
      localStorage.setItem("gamepadMapping", JSON.stringify(remote));
    } catch { /* Expected: remote gamepad mapping JSON may be malformed */ }
  }
}

export function saveGamepadMapping(mapping: GamepadMapping) {
  const normalized: GamepadMapping = {
    confirmButton: mapping.confirmButton ?? defaultGamepadMapping.confirmButton,
    backButton: mapping.backButton ?? defaultGamepadMapping.backButton,
    deadzone: clamp(mapping.deadzone ?? defaultGamepadMapping.deadzone, 0, 1),
  };
  if (typeof window !== "undefined") {
    const json = JSON.stringify(normalized);
    localStorage.setItem("gamepadMapping", json);
    window.dispatchEvent(new CustomEvent<GamepadMapping>("gamepadMappingChanged", { detail: normalized }));
    syncSettingToBackend({ gamepadMapping: json });
  }
  return normalized;
}
