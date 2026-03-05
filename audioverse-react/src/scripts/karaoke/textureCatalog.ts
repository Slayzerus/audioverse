/**
 * textureCatalog.ts — Catalog of available seamless textures for bar rendering.
 *
 * All textures reside in /textures/seamless/256x256/{Category}/.
 * Two naming conventions:
 *   - Photoreal_{Category}_{NN}-512x512.png  (8 per category)
 *   - {Category}_{NN}-256x256.png            (24 per category)
 */

export interface TextureEntry {
    /** Display-friendly label, e.g. "Fire 03" */
    label: string;
    /** URL path relative to public root */
    url: string;
}

export interface TextureCategory {
    name: string;
    /** Emoji icon for UI */
    icon: string;
    entries: TextureEntry[];
}

const BASE = '/textures/seamless/256x256';

function photoreal(category: string, count: number, icon: string): TextureCategory {
    return {
        name: category,
        icon,
        entries: Array.from({ length: count }, (_, i) => {
            const nn = String(i + 1).padStart(2, '0');
            return {
                label: `${category} ${nn}`,
                url: `${BASE}/${category}/Photoreal_${category}_${nn}-512x512.png`,
            };
        }),
    };
}

function plain(category: string, count: number, icon: string): TextureCategory {
    return {
        name: category,
        icon,
        entries: Array.from({ length: count }, (_, i) => {
            const nn = String(i + 1).padStart(2, '0');
            return {
                label: `${category} ${nn}`,
                url: `${BASE}/${category}/${category}_${nn}-256x256.png`,
            };
        }),
    };
}

/** All available texture categories */
export const TEXTURE_CATEGORIES: TextureCategory[] = [
    photoreal('Fire', 8, '🔥'),
    photoreal('Metal', 8, '⚙️'),
    photoreal('Ice', 8, '❄️'),
    photoreal('Stone', 8, '🪨'),
    photoreal('Wood', 8, '🪵'),
    photoreal('Tile', 8, '🧱'),
    photoreal('Concrete', 8, '🏗️'),
    photoreal('Trees', 8, '🌲'),
    photoreal('Grass', 8, '🌿'),
    plain('Wall', 24, '🏠'),
    plain('Rust', 24, '🟤'),
    plain('Woven', 24, '🧵'),
    plain('Ground', 24, '🟫'),
    plain('Pebbles', 24, '🫧'),
    plain('Plant', 24, '🌱'),
    plain('Roof', 24, '🏛️'),
    plain('Misc', 24, '🎨'),
];

/** Flat list of all texture entries for quick lookup */
export const ALL_TEXTURES: TextureEntry[] = TEXTURE_CATEGORIES.flatMap(c => c.entries);

/** Find a texture entry by URL */
export function findTextureByUrl(url: string): TextureEntry | undefined {
    return ALL_TEXTURES.find(t => t.url === url);
}
