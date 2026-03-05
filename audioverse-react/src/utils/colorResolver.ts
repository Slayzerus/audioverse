// Utilities to resolve CSS custom properties and parse color strings to RGB
export function resolveCssColor(color: string): string {
  if (typeof document === 'undefined') return color;
  const varRegex = /var\(\s*([^,\s)]+)\s*(?:,\s*([^)]+))?\)/;
  const m = color.match(varRegex);
  if (m) {
    const varName = m[1];
    const fallback = m[2] ? m[2].trim() : '';
    const raw = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    if (raw) return raw;
    if (fallback) return fallback;
    return color;
  }
  return color;
}

/** Parse a color string (hex or rgb(a)) into [r,g,b]. Falls back to [128,128,128]. */
export function parseColorToRgb(color: string): [number, number, number] {
  if (!color) return [128, 128, 128];
  const hexMatch = color.match(/^#([0-9a-f]{3,8})$/i);
  if (hexMatch) {
    let hex = hexMatch[1];
    if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
    // allow 6 or 8 (ignore alpha)
    if (hex.length >= 6) {
      return [parseInt(hex.slice(0,2),16), parseInt(hex.slice(2,4),16), parseInt(hex.slice(4,6),16)];
    }
  }
  const rgbMatch = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (rgbMatch) return [+rgbMatch[1], +rgbMatch[2], +rgbMatch[3]];
  return [128, 128, 128];
}

/** Resolve a CSS var(...) color and parse it to RGB. */
export function cssColorToRgb(color: string): [number, number, number] {
  const resolved = resolveCssColor(color);
  return parseColorToRgb(resolved);
}

export default { resolveCssColor, parseColorToRgb, cssColorToRgb };
