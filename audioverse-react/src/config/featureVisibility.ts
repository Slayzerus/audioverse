/**
 * Feature-visibility configuration system.
 *
 * Default rules describe every top-level navigable feature, navbar dropdown,
 * and individual mini-game.
 * Admin overrides are persisted in localStorage under `av_feature_visibility`.
 */

// ── Types ──────────────────────────────────────────────────────────

export interface FeatureVisibilityRule {
    /** Unique feature / route identifier (stable, kebab-case) */
    featureId: string;
    /** Human-readable display name shown in the admin UI */
    label: string;
    /** Navigation group this feature belongs to (for grouping in admin UI) */
    group: string;
    /**
     * Which roles can see this feature.
     * Empty array = visible to everyone.
     * e.g. ['admin'] = admin-only, ['admin','moderator'] = admin + moderator.
     */
    visibleToRoles: string[];
    /** If true, user must be authenticated to see the feature */
    requiresAuth: boolean;
    /** If true, this feature is hidden (admin override) */
    hidden: boolean;
}

// ── Defaults ───────────────────────────────────────────────────────

export const defaultFeatureRules: FeatureVisibilityRule[] = [
    // ── Navbar dropdowns (hide an entire dropdown) ─────────────────
    { featureId: "nav-music",    label: "Music menu (navbar)",   group: "Navbar",   visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "nav-games",    label: "Games menu (navbar)",   group: "Navbar",   visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "nav-create",   label: "Create menu (navbar)",  group: "Navbar",   visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "nav-social",   label: "Social menu (navbar)",  group: "Navbar",   visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "nav-admin",    label: "Admin menu (navbar)",   group: "Navbar",   visibleToRoles: ["admin"], requiresAuth: true, hidden: false },
    { featureId: "nav-profile",  label: "Profile menu (navbar)", group: "Navbar",   visibleToRoles: [], requiresAuth: true,  hidden: false },
    { featureId: "nav-settings", label: "Settings menu (navbar)",group: "Navbar",   visibleToRoles: [], requiresAuth: true,  hidden: false },

    // ── Music items ────────────────────────────────────────────────
    { featureId: "explore",          label: "Explore",            group: "Music",    visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "library",          label: "Library",            group: "Music",    visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "music-player",     label: "Music Player",       group: "Music",    visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "playlist-manager", label: "Playlist Manager",   group: "Music",    visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "songs",            label: "Songs",              group: "Music",    visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "playlists",        label: "Karaoke Playlists",  group: "Music",    visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "books",            label: "Books",              group: "Music",    visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "movies",           label: "Movies",             group: "Music",    visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "tv-shows",         label: "TV Shows",           group: "Music",    visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "sports",           label: "Sports",             group: "Music",    visibleToRoles: [], requiresAuth: false, hidden: false },

    // ── Games items ────────────────────────────────────────────────
    { featureId: "karaoke",          label: "Quick Karaoke",      group: "Games",    visibleToRoles: [], requiresAuth: true,  hidden: false },
    { featureId: "ranking",          label: "Ranking",            group: "Games",    visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "campaigns",        label: "Campaigns",          group: "Games",    visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "play",             label: "Play Hub",           group: "Games",    visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "dance",            label: "Dance",              group: "Games",    visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "board-games",      label: "Board Games",        group: "Games",    visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "video-games",      label: "Video Games",        group: "Games",    visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "mini-games",       label: "Mini Games",         group: "Games",    visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "jam-session",      label: "Jam Session",        group: "Games",    visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "honest-living",    label: "Honest Living",      group: "Games",    visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "betting",          label: "Betting",            group: "Games",    visibleToRoles: [], requiresAuth: false, hidden: false },

    // ── Create items ───────────────────────────────────────────────
    { featureId: "projects",         label: "Audio Projects",     group: "Create",   visibleToRoles: [], requiresAuth: true,  hidden: false },
    { featureId: "karaoke-editor",   label: "Karaoke Editor",     group: "Create",   visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "dmx-editor",       label: "DMX Editor",         group: "Create",   visibleToRoles: [], requiresAuth: true,  hidden: false },

    // ── Social items ───────────────────────────────────────────────
    { featureId: "parties",          label: "Parties",            group: "Social",   visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "contacts",         label: "Contacts",           group: "Social",   visibleToRoles: [], requiresAuth: true,  hidden: false },
    { featureId: "news",             label: "News",               group: "Social",   visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "external-radio",   label: "Online Radio",       group: "Social",   visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "wishlists",        label: "Wishlists",          group: "Social",   visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "gifts",            label: "Gift Registry",      group: "Social",   visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "vendors",          label: "Vendor Marketplace", group: "Social",   visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "my-offers",        label: "My Offers",          group: "Social",   visibleToRoles: [], requiresAuth: true,  hidden: false },
    { featureId: "locations",        label: "Locations & Map",    group: "Social",   visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "organizations",    label: "Organizations",      group: "Social",   visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "leagues",          label: "Leagues",            group: "Social",   visibleToRoles: [], requiresAuth: false, hidden: false },

    // ── Settings items ─────────────────────────────────────────────
    { featureId: "settings",         label: "Settings",           group: "Settings", visibleToRoles: [], requiresAuth: true,  hidden: false },
    { featureId: "controller",       label: "Controller",         group: "Settings", visibleToRoles: [], requiresAuth: true,  hidden: false },
    { featureId: "audio-input",      label: "Audio Input",        group: "Settings", visibleToRoles: [], requiresAuth: true,  hidden: false },
    { featureId: "linked-accounts",  label: "Linked Accounts",    group: "Settings", visibleToRoles: [], requiresAuth: true,  hidden: false },
    { featureId: "youtube-subs",     label: "YouTube Subscriptions", group: "Settings", visibleToRoles: [], requiresAuth: true, hidden: false },
    { featureId: "features",         label: "Features Page",      group: "Settings", visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "reset-tutorials",  label: "Reset Tutorials",    group: "Settings", visibleToRoles: [], requiresAuth: true,  hidden: false },

    // ── Profile items ──────────────────────────────────────────────
    { featureId: "profile",          label: "Profile",            group: "Profile",  visibleToRoles: [], requiresAuth: true,  hidden: false },
    { featureId: "players",          label: "Players",            group: "Profile",  visibleToRoles: [], requiresAuth: true,  hidden: false },
    { featureId: "dashboard",        label: "Dashboard",          group: "Profile",  visibleToRoles: [], requiresAuth: true,  hidden: false },
    { featureId: "progress",         label: "Progress",           group: "Profile",  visibleToRoles: [], requiresAuth: true,  hidden: false },
    { featureId: "change-password",  label: "Change Password",    group: "Profile",  visibleToRoles: [], requiresAuth: true,  hidden: false },
    { featureId: "audit-logs",       label: "My Audit Logs",      group: "Profile",  visibleToRoles: [], requiresAuth: true,  hidden: false },
    { featureId: "wiki",             label: "Wiki / Docs",        group: "Profile",  visibleToRoles: [], requiresAuth: true,  hidden: false },
    { featureId: "thesis",           label: "Praca dyplomowa",    group: "Profile",  visibleToRoles: [], requiresAuth: true,  hidden: false },

    // ── Admin items (admin-only by default) ────────────────────────
    { featureId: "admin-dashboard",       label: "Admin Dashboard",      group: "Admin",  visibleToRoles: ["admin"], requiresAuth: true, hidden: false },
    { featureId: "audit",                 label: "Audit",                group: "Admin",  visibleToRoles: ["admin"], requiresAuth: true, hidden: false },
    { featureId: "admin-users",           label: "User Management",      group: "Admin",  visibleToRoles: ["admin"], requiresAuth: true, hidden: false },
    { featureId: "admin-settings",        label: "Admin Settings",       group: "Admin",  visibleToRoles: ["admin"], requiresAuth: true, hidden: false },
    { featureId: "password-requirements", label: "Password Requirements",group: "Admin",  visibleToRoles: ["admin"], requiresAuth: true, hidden: false },
    { featureId: "scoring-presets",       label: "Scoring Presets",      group: "Admin",  visibleToRoles: ["admin"], requiresAuth: true, hidden: false },
    { featureId: "skins",                 label: "Skins",                group: "Admin",  visibleToRoles: ["admin"], requiresAuth: true, hidden: false },
    { featureId: "honeytokens",           label: "Honey Tokens",         group: "Admin",  visibleToRoles: ["admin"], requiresAuth: true, hidden: false },
    { featureId: "otp",                   label: "OTP",                  group: "Admin",  visibleToRoles: ["admin"], requiresAuth: true, hidden: false },
    { featureId: "admin-audit-logs",      label: "Audit Logs",           group: "Admin",  visibleToRoles: ["admin"], requiresAuth: true, hidden: false },
    { featureId: "login-attempts",        label: "Login Attempts",       group: "Admin",  visibleToRoles: ["admin"], requiresAuth: true, hidden: false },
    { featureId: "security-dashboard",    label: "Security Dashboard",   group: "Admin",  visibleToRoles: ["admin"], requiresAuth: true, hidden: false },
    { featureId: "moderation",            label: "Moderation",           group: "Admin",  visibleToRoles: ["admin"], requiresAuth: true, hidden: false },
    { featureId: "news-feeds",            label: "News Feeds",           group: "Admin",  visibleToRoles: ["admin"], requiresAuth: true, hidden: false },
    { featureId: "characters",            label: "Characters",           group: "Admin",  visibleToRoles: ["admin"], requiresAuth: true, hidden: false },
    { featureId: "wiki-admin",            label: "Wiki — manage pages",  group: "Admin",  visibleToRoles: ["admin"], requiresAuth: true, hidden: false },
    { featureId: "feature-visibility",    label: "Feature Visibility",   group: "Admin",  visibleToRoles: ["admin"], requiresAuth: true, hidden: false },
    { featureId: "notifications",         label: "Powiadomienia",        group: "Admin",  visibleToRoles: ["admin"], requiresAuth: true, hidden: false },
    { featureId: "asset-manager",         label: "Asset Manager",        group: "Admin",  visibleToRoles: ["admin"], requiresAuth: true, hidden: false },
    { featureId: "laboratory",            label: "Laboratory",           group: "Admin",  visibleToRoles: ["admin"], requiresAuth: true, hidden: false },
    { featureId: "diagrams",              label: "Diagrams",             group: "Admin",  visibleToRoles: ["admin"], requiresAuth: true, hidden: false },
    { featureId: "diagram-gallery",       label: "Diagram Gallery",      group: "Admin",  visibleToRoles: ["admin"], requiresAuth: true, hidden: false },
    { featureId: "events-manager",        label: "Events Manager",       group: "Admin",  visibleToRoles: ["admin"], requiresAuth: true, hidden: false },
    { featureId: "library-catalog",       label: "Library Catalog",      group: "Admin",  visibleToRoles: ["admin"], requiresAuth: true, hidden: false },

    // ── Individual mini-games (admin can hide per role) ────────────
    { featureId: "game-snakes",               label: "Snakes",               group: "Mini Games", visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "game-tron",                 label: "Tron",                 group: "Mini Games", visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "game-pong",                 label: "Pong",                 group: "Mini Games", visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "game-tag",                  label: "Tag",                  group: "Mini Games", visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "game-painters",             label: "Painters",             group: "Mini Games", visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "game-asteroids",            label: "Asteroids",            group: "Mini Games", visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "game-reaction",             label: "Reaction",             group: "Mini Games", visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "game-sumo",                 label: "Sumo",                 group: "Mini Games", visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "game-breakout",             label: "Breakout",             group: "Mini Games", visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "game-dodgeball",            label: "Dodgeball",            group: "Mini Games", visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "game-race",                 label: "Race",                 group: "Mini Games", visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "game-tanks",                label: "Tanks",                group: "Mini Games", visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "game-maze",                 label: "Maze",                 group: "Mini Games", visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "game-hockey",               label: "Hockey",               group: "Mini Games", visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "game-volleyball",           label: "Volleyball",           group: "Mini Games", visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "game-archery",              label: "Archery",              group: "Mini Games", visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "game-fishing",              label: "Fishing",              group: "Mini Games", visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "game-lava",                 label: "Lava",                 group: "Mini Games", visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "game-joust",                label: "Joust",                group: "Mini Games", visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "game-collect",              label: "Collect",              group: "Mini Games", visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "game-bounce",               label: "Bounce",               group: "Mini Games", visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "game-spiral",               label: "Spiral",               group: "Mini Games", visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "game-duel",                 label: "Duel",                 group: "Mini Games", visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "game-capture",              label: "Capture",              group: "Mini Games", visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "game-bombs",                label: "Bombs",                group: "Mini Games", visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "game-color-match",          label: "Color Match",          group: "Mini Games", visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "game-survive",              label: "Survive",              group: "Mini Games", visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "game-climber",              label: "Climber",              group: "Mini Games", visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "game-simon",                label: "Simon",                group: "Mini Games", visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "game-bunny",                label: "Bunny",                group: "Mini Games", visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "game-tetris",               label: "Tetris",               group: "Mini Games", visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "game-worms",                label: "Worms",                group: "Mini Games", visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "game-no-time-to-relax",     label: "No Time To Relax",     group: "Mini Games", visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "game-ultimate-chicken-horse",label: "Ultimate Chicken Horse",group: "Mini Games", visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "game-police-stories",       label: "Police Stories",       group: "Mini Games", visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "game-tooth-and-tail",       label: "Tooth & Tail",         group: "Mini Games", visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "game-eight-minute-empire",  label: "Eight Minute Empire",  group: "Mini Games", visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "game-overcooked",           label: "Overcooked",           group: "Mini Games", visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "game-sensible-soccer",      label: "Sensible Soccer",      group: "Mini Games", visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "game-magic-the-gathering",  label: "Magic The Gathering",  group: "Mini Games", visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "game-river-city-girls",     label: "River City Girls",     group: "Mini Games", visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "game-uplink",               label: "Uplink",               group: "Mini Games", visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "game-gta2",                 label: "GTA 2",                group: "Mini Games", visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "game-fallout",              label: "Fallout",              group: "Mini Games", visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "game-battlefield",          label: "Battlefield",          group: "Mini Games", visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "game-soldat",               label: "Soldat",               group: "Mini Games", visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "game-swords-and-sandals",   label: "Swords & Sandals",     group: "Mini Games", visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "game-battle-of-wesnoth",    label: "Battle of Wesnoth",    group: "Mini Games", visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "game-adventure-capitalist", label: "Adventure Capitalist", group: "Mini Games", visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "game-might-and-magic",      label: "Might & Magic",        group: "Mini Games", visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "game-heroes-of-might-and-magic", label: "Heroes of Might & Magic", group: "Mini Games", visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "game-oil-imperium",         label: "Oil Imperium",         group: "Mini Games", visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "game-transport-tycoon",     label: "Transport Tycoon",     group: "Mini Games", visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "game-sim-city",             label: "SimCity",              group: "Mini Games", visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "game-rts",                  label: "RTS Command",          group: "Mini Games", visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "game-settlers",             label: "Settlers",             group: "Mini Games", visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "game-pokemon",              label: "Pokémon",              group: "Mini Games", visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "game-civilization",         label: "Civilization",         group: "Mini Games", visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "game-league-of-legends",    label: "League of Legends",    group: "Mini Games", visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "game-shmup",                label: "Shmup",                group: "Mini Games", visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "game-auto-survivors",       label: "Auto Survivors",       group: "Mini Games", visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "game-doom",                 label: "Doom",                 group: "Mini Games", visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "game-memo",                 label: "Memo",                 group: "Mini Games", visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "game-drag-racing",          label: "Drag Racing",          group: "Mini Games", visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "game-car-dodge",            label: "Car Dodge",            group: "Mini Games", visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "game-star-merchant",        label: "Star Merchant",        group: "Mini Games", visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "game-master-of-orion",      label: "Master of Orion",      group: "Mini Games", visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "game-puzzle",               label: "Puzzle",               group: "Mini Games", visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "game-pipes",                label: "Pipes",                group: "Mini Games", visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "game-sim-tower",            label: "Sim Tower",            group: "Mini Games", visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "game-icy-tower",            label: "Icy Tower",            group: "Mini Games", visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "game-ships",                label: "Ships",                group: "Mini Games", visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "game-horizon-chase",        label: "Horizon Chase",        group: "Mini Games", visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "game-escape-room",          label: "Escape Room",          group: "Mini Games", visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "game-spore",                label: "Spore",                group: "Mini Games", visibleToRoles: [], requiresAuth: false, hidden: false },
    { featureId: "game-auction-house",        label: "Auction House",        group: "Mini Games", visibleToRoles: [], requiresAuth: false, hidden: false },
];

// ── Backend overrides (from SystemConfiguration) ───────────────────

/** In-memory store for backend-sourced overrides (set once on app init) */
let _backendOverrides: FeatureOverride[] = [];
let _backendOverridesVersion = 0;

/**
 * Called by UserContext after loading SystemConfiguration.
 * These take priority over localStorage overrides.
 */
export function setBackendOverrides(overrides: FeatureOverride[]): void {
    _backendOverrides = overrides ?? [];
    _backendOverridesVersion++;
}

/** Current version counter — hooks can use this to react to changes */
export function getBackendOverridesVersion(): number {
    return _backendOverridesVersion;
}

// ── LocalStorage helpers (fallback / cache) ────────────────────────

const STORAGE_KEY = "av_feature_visibility";

export type FeatureOverride = Pick<FeatureVisibilityRule, "featureId" | "visibleToRoles" | "hidden">;

/** Read admin overrides from localStorage (used as fallback before backend loads) */
export function loadOverrides(): FeatureOverride[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        return JSON.parse(raw) as FeatureOverride[];
    } catch {
        return [];
    }
}

/** Persist admin overrides to localStorage (cache for offline / instant load) */
export function saveOverrides(overrides: FeatureOverride[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
}

/**
 * Merge default rules with overrides → effective rules.
 * Priority: backend overrides > localStorage overrides > defaults.
 */
export function getEffectiveRules(): FeatureVisibilityRule[] {
    // Backend overrides take priority; fall back to localStorage
    const overrides = _backendOverrides.length > 0 ? _backendOverrides : loadOverrides();
    const overrideMap = new Map(overrides.map((o) => [o.featureId, o]));

    return defaultFeatureRules.map((rule) => {
        const override = overrideMap.get(rule.featureId);
        if (!override) return rule;
        return {
            ...rule,
            visibleToRoles: override.visibleToRoles,
            hidden: override.hidden,
        };
    });
}
