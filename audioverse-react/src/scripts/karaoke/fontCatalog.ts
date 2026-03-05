/**
 * fontCatalog.ts — Catalog of custom fonts from public/fonts/ for karaoke bar rendering.
 *
 * Each entry maps a human-readable font family name to the URL of the font file.
 * Fonts are registered as @font-face on demand so canvas can use them.
 */

export interface FontEntry {
    /** CSS font-family name to use in canvas ctx.font */
    family: string;
    /** URL path relative to public root */
    url: string;
    /** Format hint for @font-face src (truetype, opentype, woff, woff2) */
    format: string;
}
import { logger } from '../../utils/logger';
const log = logger.scoped('fontCatalog');

function entry(family: string, file: string): FontEntry {
    const ext = file.split('.').pop()?.toLowerCase() ?? '';
    const format = ext === 'otf' ? 'opentype'
        : ext === 'woff2' ? 'woff2'
        : ext === 'woff' ? 'woff'
        : 'truetype';
    return { family, url: `/fonts/${file}`, format };
}

/** All available custom fonts from public/fonts/ */
export const FONT_CATALOG: FontEntry[] = [
    entry('Belagak', 'BelagakRegular-dr1zE.otf'),
    entry('Big Scratch Brush', 'BigScratchBrush-PVY9g.ttf'),
    entry('Gerhaus', 'Gerhaus-PK69E.ttf'),
    entry('Gerhaus Italic', 'GerhausItalic-d96l7.ttf'),
    entry('Handone Medium', 'HandoneMedium-nAevO.otf'),
    entry('Handson Bold', 'HandsonBold-9MnrL.otf'),
    entry('Kineks Round Bold', 'KineksRoundBold-7OR34.ttf'),
    entry('Kineks Round Light', 'KineksRoundLight-m2r35.ttf'),
    entry('Kineks Round Medium', 'KineksRoundMedium-drejZ.ttf'),
    entry('Kineks Round', 'KineksRoundRegular-PVRl7.ttf'),
    entry('Kineks Round SemiBold', 'KineksRoundSemiBold-LVWG3.ttf'),
    entry('Lemon Jelly', 'LemonJellyPersonalUse-dEqR.ttf'),
    entry('Lemon Milk Bold', 'LemonMilkBold-gx2B3.otf'),
    entry('Lemon Milk Bold Italic', 'LemonMilkBoldItalic-PKZ3P.otf'),
    entry('Lemon Milk Light', 'LemonMilkLight-owxMq.otf'),
    entry('Lemon Milk Light Italic', 'LemonMilkLightItalic-7BjPE.otf'),
    entry('Lemon Milk Medium', 'LemonMilkMedium-mLZYV.otf'),
    entry('Lemon Milk Medium Italic', 'LemonMilkMediumItalic-d95nl.otf'),
    entry('Lemon Milk', 'LemonMilkRegular-X3XE2.otf'),
    entry('Lemon Milk Italic', 'LemonMilkRegularItalic-L3AEy.otf'),
    entry('Pemage', 'PemageRegular-YqrdO.otf'),
    entry('Rosmatika', 'RosmatikaRegular-BWA45.ttf'),
    entry('Scabber', 'Scabber-q2Mn0.ttf'),
    entry('Stylish Calligraphy', 'StylishCalligraphyDemo-XPZZ.ttf'),
    entry('Super Adorable', 'SuperAdorable-MAvyp.ttf'),
    entry('Super Chiby', 'SuperChiby-BL62V.ttf'),
    entry('Super Joyful', 'SuperJoyful-lxwPq.ttf'),
    entry('Super Kindly', 'SuperKindly-drE8E.ttf'),
    entry('Super Meatball', 'SuperMeatball-Yq1Gy.ttf'),
];

/** Set of already-registered font families (to avoid duplicate @font-face) */
const registeredFonts = new Set<string>();

/**
 * Register a custom font via @font-face so canvas ctx.font can use it.
 * Returns a promise that resolves when the font is loaded and ready.
 */
export async function loadCustomFont(fe: FontEntry): Promise<void> {
    if (registeredFonts.has(fe.family)) return;
    registeredFonts.add(fe.family);

    const face = new FontFace(fe.family, `url('${fe.url}') format('${fe.format}')`);
    try {
        const loaded = await face.load();
        document.fonts.add(loaded);
    } catch (err) {
        log.warn(`Failed to load font "${fe.family}":`, err);
        registeredFonts.delete(fe.family);
    }
}

/**
 * Ensure the given font family is loaded and ready for canvas use.
 * If it's a custom font from the catalog, registers @font-face and loads it.
 * For system fonts (Arial etc.) this is a no-op.
 */
export async function ensureFontLoaded(family: string): Promise<void> {
    const entry = FONT_CATALOG.find(f => f.family === family);
    if (entry) {
        await loadCustomFont(entry);
    }
    // System fonts — nothing to do
}

/** Find a font entry by family name */
export function findFontByFamily(family: string): FontEntry | undefined {
    return FONT_CATALOG.find(f => f.family === family);
}
