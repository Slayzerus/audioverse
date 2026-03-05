/**
 * glossyBarPatterns.ts — Overlay pattern definitions for glossy karaoke bars.
 *
 * Each pattern is an SVG <pattern> generator that produces a tiling fill.
 * 30 patterns total including flames, zigzag, scales, hex, dots, stars, etc.
 */

// ────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────

/** Named overlay pattern */
export interface OverlayPattern {
    name: string;
    /** Generate an SVG <pattern> element string. `color` = primary, `color2` = optional secondary */
    mk: (id: string, color: string, color2?: string) => string;
}

// ────────────────────────────────────────────────
// Overlay patterns — 30 patterns (9 fixed)
// ────────────────────────────────────────────────

export const OVERLAY_PATTERNS: OverlayPattern[] = [
    {
        name: 'Flames', mk: (id, c, c2?) => {
            const s = c2 || c;
            return `<pattern id="${id}" width="12" height="16" patternUnits="userSpaceOnUse">` +
            `<path d="M6 0C8 3 10 5 9 9C8 12 6 14 6 16C6 14 4 12 3 9C2 5 4 3 6 0Z" fill="${c}" opacity=".5"/>` +
            `<path d="M3 6C4 8 5 10 3 14C1 10 2 8 3 6Z" fill="${s}" opacity=".3"/>` +
            `<path d="M9 6C10 8 11 10 9 14C7 10 8 8 9 6Z" fill="${s}" opacity=".3"/>` +
            `</pattern>`;
        }
    },
    {
        name: 'Zigzag', mk: (id, c, c2?) => {
            const s = c2 || c;
            return `<pattern id="${id}" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M0 5L5 0L10 5L5 10Z" fill="${s}" fill-opacity=".15" stroke="${c}" stroke-width="1.2" opacity=".55"/></pattern>`;
        }
    },
    {
        name: 'Scales', mk: (id, c, c2?) => {
            const s = c2 || c;
            return `<pattern id="${id}" width="12" height="8" patternUnits="userSpaceOnUse"><ellipse cx="6" cy="8" rx="6" ry="4.5" fill="none" stroke="${c}" stroke-width="1" opacity=".5"/><ellipse cx="0" cy="4" rx="6" ry="4.5" fill="none" stroke="${s}" stroke-width=".8" opacity=".3"/><ellipse cx="12" cy="4" rx="6" ry="4.5" fill="none" stroke="${s}" stroke-width=".8" opacity=".3"/></pattern>`;
        }
    },
    {
        name: 'Hex', mk: (id, c, c2?) => {
            const s = c2 || c;
            return `<pattern id="${id}" width="18" height="20" patternUnits="userSpaceOnUse">` +
            `<path d="M9 2L16 6V14L9 18L2 14V6Z" fill="none" stroke="${c}" stroke-width="1" opacity=".45"/>` +
            `<path d="M9 12L13.5 14.5V19L9 21.5L4.5 19V14.5Z" fill="none" stroke="${s}" stroke-width=".6" opacity=".25"/>` +
            `</pattern>`;
        }
    },
    {
        name: 'Dots', mk: (id, c, c2?) => {
            const s = c2 || c;
            return `<pattern id="${id}" width="8" height="8" patternUnits="userSpaceOnUse"><circle cx="4" cy="4" r="2" fill="${c}" opacity=".5"/><circle cx="0" cy="0" r="1" fill="${s}" opacity=".3"/><circle cx="8" cy="8" r="1" fill="${s}" opacity=".3"/></pattern>`;
        }
    },
    {
        name: 'Stars', mk: (id, c, c2?) => {
            const s = c2 || c;
            return `<pattern id="${id}" width="14" height="14" patternUnits="userSpaceOnUse"><path d="M7 1L8.8 5.2L13.2 5.2L9.7 7.8L11 12.2L7 9.4L3 12.2L4.3 7.8L.8 5.2L5.2 5.2Z" fill="${c}" opacity=".45" stroke="${s}" stroke-width=".4" stroke-opacity=".3"/></pattern>`;
        }
    },
    {
        name: 'Diamonds', mk: (id, c, c2?) => {
            const s = c2 || 'none';
            return `<pattern id="${id}" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M5 .5L9.5 5L5 9.5L.5 5Z" fill="${s}" fill-opacity=".15" stroke="${c}" stroke-width="1" opacity=".5"/></pattern>`;
        }
    },
    {
        name: 'Waves', mk: (id, c, c2?) => {
            const s = c2 || c;
            return `<pattern id="${id}" width="16" height="8" patternUnits="userSpaceOnUse"><path d="M0 4Q4 0 8 4Q12 8 16 4" fill="none" stroke="${c}" stroke-width="1.3" opacity=".5"/><path d="M0 6Q4 2 8 6Q12 10 16 6" fill="none" stroke="${s}" stroke-width=".6" opacity=".25"/></pattern>`;
        }
    },
    {
        name: 'Crosses', mk: (id, c, c2?) => {
            const s = c2 || c;
            return `<pattern id="${id}" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M5 2V8" stroke="${c}" stroke-width="1.3" stroke-linecap="round" opacity=".5"/><path d="M2 5H8" stroke="${s}" stroke-width="1.3" stroke-linecap="round" opacity=".5"/></pattern>`;
        }
    },
    {
        name: 'Triangles', mk: (id, c, c2?) => {
            const s = c2 || 'none';
            return `<pattern id="${id}" width="12" height="10" patternUnits="userSpaceOnUse"><path d="M6 1L11 9H1Z" fill="${s}" fill-opacity=".12" stroke="${c}" stroke-width="1" opacity=".5"/></pattern>`;
        }
    },
    {
        name: 'Chevrons', mk: (id, c, c2?) => {
            const s = c2 || c;
            return `<pattern id="${id}" width="12" height="10" patternUnits="userSpaceOnUse"><path d="M0 7L6 1.5L12 7" fill="none" stroke="${c}" stroke-width="1.2" opacity=".55"/><path d="M0 10L6 4.5L12 10" fill="none" stroke="${s}" stroke-width=".7" opacity=".25"/></pattern>`;
        }
    },
    {
        name: 'Hatch ╲', mk: (id, c, c2?) => {
            const s = c2 || c;
            return `<pattern id="${id}" width="6" height="6" patternUnits="userSpaceOnUse"><path d="M0 6L6 0" stroke="${c}" stroke-width="1" opacity=".45"/><path d="M-1 1L1 -1M5 7L7 5" stroke="${s}" stroke-width=".8" opacity=".3"/></pattern>`;
        }
    },
    {
        name: 'Hatch ╳', mk: (id, c, c2?) => {
            const s = c2 || c;
            return `<pattern id="${id}" width="7" height="7" patternUnits="userSpaceOnUse"><path d="M0 7L7 0" stroke="${c}" stroke-width=".8" opacity=".4"/><path d="M0 0L7 7" stroke="${s}" stroke-width=".8" opacity=".4"/></pattern>`;
        }
    },
    {
        name: 'Grid', mk: (id, c, c2?) => {
            const s = c2 || c;
            return `<pattern id="${id}" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M10 0V10" fill="none" stroke="${c}" stroke-width=".8" opacity=".4"/><path d="M0 10H10" fill="none" stroke="${s}" stroke-width=".8" opacity=".4"/></pattern>`;
        }
    },
    {
        name: 'Bricks', mk: (id, c, c2?) => {
            const s = c2 || c;
            return `<pattern id="${id}" width="14" height="8" patternUnits="userSpaceOnUse"><rect width="14" height="8" fill="none" stroke="${c}" stroke-width=".8" opacity=".4"/><line x1="7" y1="0" x2="7" y2="4" stroke="${s}" stroke-width=".8" opacity=".4"/></pattern>`;
        }
    },
    {
        name: 'Hearts', mk: (id, c, c2?) => {
            const s = c2 || c;
            return `<pattern id="${id}" width="12" height="12" patternUnits="userSpaceOnUse"><path d="M6 10C4 8 1 6.5 1 4C1 2.3 2.8 1 4.5 2.2L6 4L7.5 2.2C9.2 1 11 2.3 11 4C11 6.5 8 8 6 10Z" fill="${c}" opacity=".4" stroke="${s}" stroke-width=".5" stroke-opacity=".3"/></pattern>`;
        }
    },
    {
        name: 'Arrows', mk: (id, c, c2?) => {
            const s = c2 || 'none';
            return `<pattern id="${id}" width="12" height="10" patternUnits="userSpaceOnUse">` +
            `<path d="M3 2L9 5L3 8" fill="${s}" fill-opacity=".15" stroke="${c}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity=".5"/>` +
            `</pattern>`;
        }
    },
    {
        name: 'Bolts', mk: (id, c, c2?) => {
            const s = c2 || c;
            return `<pattern id="${id}" width="12" height="16" patternUnits="userSpaceOnUse">` +
            `<path d="M7 1L4 7H8L3 15" fill="none" stroke="${c}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity=".5"/>` +
            `<circle cx="5" cy="11" r="1" fill="${s}" opacity=".3"/>` +
            `</pattern>`;
        }
    },
    {
        name: 'Leaves', mk: (id, c, c2?) => {
            const s = c2 || c;
            return `<pattern id="${id}" width="14" height="14" patternUnits="userSpaceOnUse">` +
            `<path d="M7 2C10 4 12 7 10 11C8 13 5 12 4 10C3 7 4 4 7 2Z" fill="none" stroke="${c}" stroke-width="1" opacity=".45"/>` +
            `<path d="M7 3L6 10" stroke="${s}" stroke-width=".6" opacity=".3"/>` +
            `<path d="M5 5L7 6M5 8L7 7.5" stroke="${s}" stroke-width=".4" opacity=".25"/>` +
            `</pattern>`;
        }
    },
    {
        name: 'Spirals', mk: (id, c, c2?) => {
            const s = c2 || c;
            return `<pattern id="${id}" width="16" height="16" patternUnits="userSpaceOnUse">` +
            `<path d="M8 4A4 4 0 0 1 12 8A3.5 3.5 0 0 1 8.5 11.5A2.5 2.5 0 0 1 6 9A1.5 1.5 0 0 1 7.5 7.5" fill="none" stroke="${c}" stroke-width="1.2" stroke-linecap="round" opacity=".45"/>` +
            `<circle cx="8" cy="8" r="1" fill="${s}" opacity=".25"/>` +
            `</pattern>`;
        }
    },
    {
        name: 'Moons', mk: (id, c, c2?) => {
            const s = c2 || c;
            return `<pattern id="${id}" width="14" height="14" patternUnits="userSpaceOnUse">` +
            `<path d="M9 2A5 5 0 1 0 9 12" fill="none" stroke="${c}" stroke-width="1" opacity=".4"/>` +
            `<path d="M9 2A3.5 3.5 0 0 1 9 12" fill="none" stroke="${s}" stroke-width="1" opacity=".3"/>` +
            `</pattern>`;
        }
    },
    {
        name: 'Rings', mk: (id, c, c2?) => {
            const s = c2 || c;
            return `<pattern id="${id}" width="12" height="12" patternUnits="userSpaceOnUse"><circle cx="6" cy="6" r="4" fill="none" stroke="${c}" stroke-width="1.2" opacity=".5"/><circle cx="6" cy="6" r="2" fill="none" stroke="${s}" stroke-width=".6" opacity=".25"/></pattern>`;
        }
    },
    {
        name: 'Teeth', mk: (id, c, c2?) => {
            const s = c2 || 'none';
            return `<pattern id="${id}" width="8" height="10" patternUnits="userSpaceOnUse"><path d="M0 10V4L4 0L8 4V10" fill="${s}" fill-opacity=".12" stroke="${c}" stroke-width="1" opacity=".5"/></pattern>`;
        }
    },
    {
        name: 'Swirl', mk: (id, c, c2?) => {
            const s = c2 || c;
            return `<pattern id="${id}" width="16" height="10" patternUnits="userSpaceOnUse"><path d="M0 5C3 0 6 0 8 5C10 10 13 10 16 5" fill="none" stroke="${c}" stroke-width="1.3" opacity=".5"/><path d="M0 7C3 2 6 2 8 7C10 12 13 12 16 7" fill="none" stroke="${s}" stroke-width=".6" opacity=".2"/></pattern>`;
        }
    },
    {
        name: 'Chain', mk: (id, c, c2?) => {
            const s = c2 || c;
            return `<pattern id="${id}" width="10" height="16" patternUnits="userSpaceOnUse"><ellipse cx="5" cy="4" rx="3.5" ry="4" fill="none" stroke="${c}" stroke-width="1" opacity=".45"/><ellipse cx="5" cy="12" rx="3.5" ry="4" fill="none" stroke="${s}" stroke-width="1" opacity=".45"/></pattern>`;
        }
    },
    {
        name: 'Feathers', mk: (id, c, c2?) => {
            const s = c2 || c;
            return `<pattern id="${id}" width="12" height="18" patternUnits="userSpaceOnUse">` +
            `<path d="M6 1C9 5 10 9 6 17" fill="none" stroke="${c}" stroke-width=".8" opacity=".4"/>` +
            `<path d="M6 1C3 5 2 9 6 17" fill="none" stroke="${c}" stroke-width=".8" opacity=".4"/>` +
            `<path d="M4 5L6 4L8 5M4 9L6 8L8 9M4 13L6 12L8 13" stroke="${s}" stroke-width=".5" opacity=".3"/>` +
            `</pattern>`;
        }
    },
    {
        name: 'DNA', mk: (id, c, c2?) => {
            const s = c2 || c;
            return `<pattern id="${id}" width="14" height="18" patternUnits="userSpaceOnUse"><path d="M3 0C3 4.5 11 4.5 11 9S3 13.5 3 18" fill="none" stroke="${c}" stroke-width="1" opacity=".45"/><path d="M11 0C11 4.5 3 4.5 3 9S11 13.5 11 18" fill="none" stroke="${s}" stroke-width="1" opacity=".45"/></pattern>`;
        }
    },
    {
        name: 'Bubbles', mk: (id, c, c2?) => {
            const s = c2 || c;
            return `<pattern id="${id}" width="18" height="18" patternUnits="userSpaceOnUse"><circle cx="5" cy="5" r="3.5" fill="none" stroke="${c}" stroke-width=".8" opacity=".4"/><circle cx="14" cy="12" r="4.5" fill="none" stroke="${s}" stroke-width=".8" opacity=".35"/><circle cx="11" cy="3" r="1.8" fill="${s}" opacity=".25"/></pattern>`;
        }
    },
    {
        name: 'Celtic', mk: (id, c, c2?) => {
            const s = c2 || c;
            return `<pattern id="${id}" width="16" height="16" patternUnits="userSpaceOnUse">` +
            `<path d="M8 2C12 2 14 4 14 8C14 12 12 14 8 14C4 14 2 12 2 8C2 4 4 2 8 2Z" fill="none" stroke="${c}" stroke-width=".8" opacity=".35"/>` +
            `<path d="M4 4L12 12M12 4L4 12" stroke="${s}" stroke-width=".6" opacity=".2"/>` +
            `</pattern>`;
        }
    },
    {
        name: 'Squares', mk: (id, c, c2?) => {
            const s = c2 || 'none';
            return `<pattern id="${id}" width="10" height="10" patternUnits="userSpaceOnUse"><rect x="1.5" y="1.5" width="7" height="7" rx="1" fill="${s}" fill-opacity=".12" stroke="${c}" stroke-width="1" opacity=".5"/></pattern>`;
        }
    },
];

/** Lookup a pattern by name */
export function getPatternByName(name: string): OverlayPattern | null {
    return OVERLAY_PATTERNS.find(p => p.name === name) || null;
}
