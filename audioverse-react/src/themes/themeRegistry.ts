import type { ThemeDef } from './themeTypes';
import {
  midnight, daylight, synthwave, forest, ocean, sunset,
  sakura, cyberpunk, coffee, aurora, lavender, hacker,
} from './fullThemes';
import {
  velvetNight, saffronGlow, crimsonSilk, amberKiss, velvetPlum, roseWhisper,
  midnightBloom, moonlitAmber, silkNoir, cocoaMist, opalDusk, desertRose,
  moonshadow, rosewood, silkenAzure, nocturne, lavenderHaze, seduction,
  coralVeil, garnet, opaline, silhouette, honeyed, eclipse, amberNight,
  pearlVeil, scarletLace, velour, silkRose, twilightSilk,
} from './seededThemes';

// ─── Export all themes ────────────────────────────────────────────

export const ALL_THEMES: ThemeDef[] = [
  midnight,
  daylight,
  synthwave,
  forest,
  ocean,
  sunset,
  sakura,
  cyberpunk,
  coffee,
  aurora,
  lavender,
  hacker,
  // seeded additions
  velvetNight,
  saffronGlow,
  crimsonSilk,
  amberKiss,
  velvetPlum,
  roseWhisper,
  midnightBloom,
  moonlitAmber,
  silkNoir,
  cocoaMist,
  opalDusk,
  desertRose,
  moonshadow,
  rosewood,
  silkenAzure,
  nocturne,
  lavenderHaze,
  seduction,
  coralVeil,
  garnet,
  opaline,
  silhouette,
  honeyed,
  eclipse,
  amberNight,
  pearlVeil,
  scarletLace,
  velour,
  silkRose,
  twilightSilk,
];

export const THEME_MAP = Object.fromEntries(ALL_THEMES.map(t => [t.id, t])) as Record<string, ThemeDef>;

export const DEFAULT_THEME_ID = 'midnight';
