# Karaoke Scoring Parameters — Finalized Defaults

This document records the finalized default scoring parameters used by the Karaoke scoring engine (UltraStar‑parity tuning).

Notes:
- Values are the canonical defaults used at runtime unless overridden by admin presets (runtime will fetch `/api/config/karaoke-scoring`).
- Units: `preWindow` and `postExtra` are in seconds; `semitoneTolerance` is integer semitone steps; `difficultyMult` is multiplier applied to base scoring.

Default presets (Finalized):

- Easy
  - semitoneTolerance: 2
  - preWindow: 0.25
  - postExtra: 0.30
  - difficultyMult: 0.90

- Normal
  - semitoneTolerance: 1
  - preWindow: 0.15
  - postExtra: 0.20
  - difficultyMult: 1.00

- Hard
  - semitoneTolerance: 0
  - preWindow: 0.08
  - postExtra: 0.12
  - difficultyMult: 1.05

Implementation notes:
- Frontend loads these defaults from `src/constants/karaokeScoringConfig.ts` and then merges remote admin presets (if available) via `loadRemoteScoringPresets()` on app startup.
- To change defaults permanently, update `DefaultScoringPresets` in `src/constants/karaokeScoringConfig.ts` and coordinate with backend admin presets.
- Consider running parity harness sweeps when tuning changes are made to validate parity vs UltraStar WP.

QA checklist:
- Verify scoring results across a small representative set of songs for each difficulty.
- Run parity harness export and compare CSV/JSON with UltraStar reference outputs.
- Confirm admin presets page (`/admin/scoring-presets`) can override and persist presets.

