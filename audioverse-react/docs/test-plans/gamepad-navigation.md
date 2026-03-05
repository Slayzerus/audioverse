# Gamepad Navigation Test Plan

Scope: manual/E2E checks for focus, dropdowns, edge cases, and focus loss across core karaoke flows.

## Setup
- Connect at least 2 gamepads; ensure browser has gamepad access.
- Optional: set `localStorage.gamepadDeadzone` for threshold overrides.
- Start app, log in, and ensure microphones and players are configured.

## Global Navigation
- Arrow keys mirror gamepad: focus moves in all directions, Enter/Space activates.
- Focus ring shows on active element; no focus trap when cycling through pages.
- Switching pads: whichever pad sends input becomes active; focus responds to it.

## Song Browser
- Move focus through: Group selector (dropdown), filter toggle, each song tile (Focusables wrap buttons).
- Open dropdown with A/Enter, change option, close; focus returns correctly.
- With no mics assigned: song buttons disabled; focus stays on enabled controls.
- With mics assigned: select a song; loading state shown; navigation blocked only during loading.

## Round (KaraokeManager)
- Play/pause via Start/Space; demo mode stops at 12s.
- On track end, summary overlay appears; `Back to songs` is focused by default; Enter activates navigate; Replay refocuses main UI.
- Ensure focus cannot escape overlay while it is open.

## Focus Loss & Edge Cases
- Disconnect active pad: focus stays but no movement; reconnect restores control.
- Browser tab blur/restore: focus metadata still valid; navigation resumes.
- If no focusable elements on screen, no errors thrown; navigation awaits new focusables.

## Dropdowns & Forms
- Any select wrapped in Focusable: open/close with A/Enter; B/Escape (keyboard Escape) closes without breaking focus.
- Typing in inputs is not blocked by navigation handlers (Space/Enter guarded).

## Regression Quick Pass
- Move through navbar pages with pad; ensure page-level Focusable present (`page-*`).
- Verify deadzone filtering: slight stick drift should not move focus.
- Multi-pad: press button on second pad, it becomes active, navigation follows it.

## Expected Results
- No focus trap; no unexpected scroll jumps; no lost focus after overlays or dropdowns.
- Activation triggers underlying click handlers exactly once.
- Disabled controls remain non-activatable via pad or keyboard.
