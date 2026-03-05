// Preferowane kolory graczy (najpierw 4 klasyczne, potem kolejne)
export const PLAYER_COLORS = [
  '#2196f3', // niebieski
  '#e53935', // czerwony
  '#ffeb3b', // żółty
  '#43a047', // zielony
  '#ff9800', // pomarańczowy
  '#9c27b0', // fioletowy
  '#00bcd4', // cyjan
  '#ffc107', // bursztynowy
  '#8bc34a', // limonkowy
  '#f44336', // karmazynowy
  '#3f51b5', // indygo
  '#607d8b', // niebieskoszary
  '#795548', // brązowy
  '#cddc39', // limonka
  '#673ab7', // ciemny fiolet
  '#009688', // teal
];

// Zwraca pierwszy wolny kolor z listy preferencji
export function getNextPlayerColor(usedColors: string[]): string {
  for (const color of PLAYER_COLORS) {
    if (!usedColors.includes(color)) return color;
  }
  // Jeśli wszystkie zajęte, losuj z całej puli
  return PLAYER_COLORS[Math.floor(Math.random() * PLAYER_COLORS.length)];
}

// CSS variable fallbacks for themes that may provide player-specific colors.
export const PLAYER_COLOR_VARS = PLAYER_COLORS.map((c, i) => `var(--player-color-${i + 1}, ${c})`);

// Returns a CSS-safe color string (prefer `var(...)` so themes can override,
// but fall back to the original hex when the var is not defined).
export function getNextPlayerColorCss(usedColors: string[]): string {
  for (let i = 0; i < PLAYER_COLORS.length; i++) {
    const hex = PLAYER_COLORS[i];
    const varStr = PLAYER_COLOR_VARS[i];
    if (!usedColors.includes(hex) && !usedColors.includes(varStr)) return varStr;
  }
  return PLAYER_COLOR_VARS[Math.floor(Math.random() * PLAYER_COLOR_VARS.length)];
}
