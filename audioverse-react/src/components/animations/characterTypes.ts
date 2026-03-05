// components/animations/characterTypes.ts
// Konfiguracja elementów postaci + listy wariantów i domyślne kolory

export type FeatureConfig = {
    /** nazwa wariantu, np. "short", "dot" itp. */
    variant: string;
    /** 1+ colors per variant. Excess trimmed in renderers, missing duplicated. */
    colors: string[]; // [base, accent?, stroke?/outline?, ...extra]
};

export type CharacterConfig = {
    face: FeatureConfig;      // kształt głowy / skóra
    hair: FeatureConfig;      // fryzura
    eyes: FeatureConfig;      // oczy
    nose: FeatureConfig;      // nos
    mouth: FeatureConfig;     // usta
    outfit: FeatureConfig;    // ubranie/tułów (shape + pattern)
    headwear: FeatureConfig;  // nakrycie głowy (czapki, słuchawki, itp.)
    prop: FeatureConfig;      // rekwizyt (np. mikrofon, tabliczka itp.)
    name?: string;
    size?: number; // px
};

export const VARIANTS = {
    // 14+ kształtów głowy
    face: [
        "round","oval","square","heart","diamond","long","chubby","flatTop",
        "egg","triangle","hex","pear","bean","heroJaw"
    ],

    // 20+ fryzur
    hair: [
        "none","short","long","curly","wavy","mohawk","afro","bunHigh","bunLow","bob",
        "pixie","sidePart","undercut","spiky","braids","dreadlocks","ponytail","twinTails","mullet","balding","bangs"
    ],

    // 16+ oczu (z warstwami sclera/iris/pupil/highlight + powieki/rzęsy/brwi)
    eyes: [
        "classic","big","anime","sleepy","angry","surprised","winkLeft","winkRight","smile",
        "oval","upturned","downturned","lashes","sparkle","heart","star","sad","focused"
    ],

    // 10+ nosów
    nose: ["line","triangle","round","button","hook","flat","wide","tiny","pointy","roman","none"],

    // 14+ ust
    mouth: [
        "smile","frown","open","flat","o","grin","teeth","smirk","wow","tongue",
        "laugh","sad","angry","kiss","grimace"
    ],

    // 16+ outfitów (shape+pattern – t-shirt, hoodie, marynarka, pasiaki, jersey, itd.)
    outfit: [
        "tee","hoodie","suit","dress","tank","jacket","blazer","vest",
        "sweatshirt","kimono","polo","stripes","checker","jersey","tux","robe"
    ],

    // 18+ nakryć głowy
    headwear: [
        "none","cap","headphones","hat","crown","beanie","bandana","visor","bow","tiara",
        "fedora","beret","headband","helmet","headsetMic","hood","cowboy","bunnyEars"
    ],

    // 20+ rekwizytów (w tym „scoreCard”)
    prop: [
        "none","mic","clipboard","star","flag","phone","glass","trophy","rose","glowstick",
        "megaphone","tambourine","lightstick","scoreCard","camera","tablet","remote","foamFinger","whistle","drumstick"
    ],
} as const;

export const DEFAULT_COLORS = {
    skin: "var(--anim-skin, #FFD2B3)",
    hair: "var(--anim-hair, #1F2937)",
    shirt: "var(--anim-shirt, #3B82F6)",
    stroke: "var(--anim-stroke, #111111)",
};

export const DEFAULT_CHARACTER: CharacterConfig = {
    name: "Juror",
    size: 180,
    face:  { variant: "round",   colors: [DEFAULT_COLORS.skin, "var(--anim-skin-2, #F9C7B0)", DEFAULT_COLORS.stroke] },
    hair:  { variant: "short",   colors: [DEFAULT_COLORS.hair, "var(--anim-hair-2, #2C3A4A)"] },
    eyes:  { variant: "classic", colors: ["var(--white, #FFFFFF)","var(--anim-eye-iris, #2563EB)",DEFAULT_COLORS.stroke,"var(--white, #FFFFFF)"] }, // sclera, iris, pupil, highlight
    nose:  { variant: "line",    colors: [DEFAULT_COLORS.stroke] },
    mouth: { variant: "smile",   colors: ["var(--anim-lip, #E11D48)","var(--anim-inner, #FEE2E2)", DEFAULT_COLORS.stroke] }, // lip, inner/teeth, outline
    outfit:{ variant: "tee",     colors: [DEFAULT_COLORS.shirt, "var(--anim-outfit-2, #2563EB)", DEFAULT_COLORS.stroke] },
    headwear: { variant: "none", colors: [DEFAULT_COLORS.stroke] },
    prop:  { variant: "mic",     colors: [DEFAULT_COLORS.stroke, "var(--anim-prop-2, #666666)", "var(--anim-prop-3, #CCCCCC)"] },
};

/** Returns color from list; if missing – uses last or fallback */
export function pick(colors: string[], index: number, fallback?: string): string {
    if (!colors || colors.length === 0) return fallback ?? "var(--anim-default-black, #000000)";
    const i = Math.min(colors.length - 1, Math.max(0, index));
    return colors[i] ?? fallback ?? colors[0];
}
