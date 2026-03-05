/**
 * breadcrumbRegistry.ts — Centralized, data-driven breadcrumb definitions.
 *
 * Each entry maps a route pattern to its breadcrumb chain. The registry is the
 * single source of truth — pages don't hardcode their own crumbs, they are
 * resolved automatically from the current pathname.
 *
 * Dynamic segments (`:param`) are replaced at runtime by the matching URL
 * segment value. Pages can also push *dynamic* crumbs at runtime through the
 * BreadcrumbContext (e.g. party name, wiki page title).
 */

// ── Types ──────────────────────────────────────────────────────────

export interface BreadcrumbEntry {
  /** i18n key — resolved via t(labelKey, { defaultValue: labelDefault }) */
  labelKey: string;
  /** Fallback English label when i18n is unavailable */
  labelDefault: string;
  /** Absolute path (may contain `:param` placeholders) */
  path: string;
}

export interface BreadcrumbRoute {
  /** Route pattern (same syntax as React Router — may contain `:param` or `*`) */
  pattern: string;
  /** Ordered breadcrumb chain, root → current (Home is auto-prepended) */
  crumbs: BreadcrumbEntry[];
  /** If true, breadcrumbs are hidden even when globally enabled */
  hidden?: boolean;
}

// ── Helpers ────────────────────────────────────────────────────────

const crumb = (labelKey: string, labelDefault: string, path: string): BreadcrumbEntry => ({
  labelKey,
  labelDefault,
  path,
});

// ── Routes that should NOT show breadcrumbs ────────────────────────
// (play, karaoke, games — immersive screens)
const HIDDEN_PATTERNS = new Set([
  "/play",
  "/parties/:partyId",
  "/karaoke-editor",
  "/karaoke-editor/:songIdParam",
  "/hit-that-note",
  "/join",
  "/join/:partyId",
  "/dmx-editor",
  "/honest-living/*",
  "/mini-games/*",
  "/tuning-harness",
  // Callbacks
  "/spotifyCallback",
  "/twitchCallback",
  "/googleCallback",
  "/youtubeCallback",
  "/tidalCallback",
  "/microsoftCallback",
  "/discordCallback",
]);

// ── Registry ───────────────────────────────────────────────────────

const PLAY_CRUMB = crumb("breadcrumb.play", "Play", "/play");
const MUSIC_CRUMB = crumb("breadcrumb.music", "Music", "/music-player");
const SETTINGS_CRUMB = crumb("breadcrumb.settings", "Settings", "/settings");
const ADMIN_CRUMB = crumb("breadcrumb.admin", "Admin", "/admin");
const PROFILE_CRUMB = crumb("breadcrumb.profile", "Profile", "/profile");
const CREATE_CRUMB = crumb("breadcrumb.create", "Create", "/create/projects");
const EXPLORE_CRUMB = crumb("breadcrumb.explore", "Explore", "/explore");
const VENDORS_CRUMB = crumb("breadcrumb.vendors", "Vendors", "/vendors");
const WIKI_CRUMB = crumb("breadcrumb.wiki", "Wiki", "/wiki");

export const breadcrumbRoutes: BreadcrumbRoute[] = [
  // ── Home ─────────────────────────────────────────────────────────
  { pattern: "/", crumbs: [], hidden: true },
  { pattern: "/login", crumbs: [crumb("breadcrumb.login", "Login", "/login")] },
  { pattern: "/register", crumbs: [crumb("breadcrumb.register", "Register", "/register")] },
  { pattern: "/first-login-password-change", crumbs: [crumb("breadcrumb.changePassword", "Change Password", "/first-login-password-change")] },
  { pattern: "/features", crumbs: [crumb("breadcrumb.features", "Features", "/features")] },

  // ── Play / Party ─────────────────────────────────────────────────
  { pattern: "/play", crumbs: [PLAY_CRUMB], hidden: true },
  { pattern: "/parties", crumbs: [PLAY_CRUMB, crumb("breadcrumb.parties", "Parties", "/parties")] },
  { pattern: "/parties/:partyId", crumbs: [PLAY_CRUMB, crumb("breadcrumb.parties", "Parties", "/parties"), crumb("breadcrumb.partyDetail", "Party", "/parties/:partyId")], hidden: true },
  { pattern: "/songs", crumbs: [PLAY_CRUMB, crumb("breadcrumb.songs", "Songs", "/songs")] },
  { pattern: "/karaoke-playlists", crumbs: [PLAY_CRUMB, crumb("breadcrumb.karaokePlaylists", "Karaoke Playlists", "/karaoke-playlists")] },
  { pattern: "/rounds", crumbs: [PLAY_CRUMB, crumb("breadcrumb.rounds", "Rounds", "/rounds")] },
  { pattern: "/dance", crumbs: [PLAY_CRUMB, crumb("breadcrumb.dance", "Dance", "/dance")] },
  { pattern: "/jam-session", crumbs: [PLAY_CRUMB, crumb("breadcrumb.jamSession", "Jam Session", "/jam-session")] },

  // ── Campaigns ────────────────────────────────────────────────────
  { pattern: "/campaigns", crumbs: [crumb("breadcrumb.campaigns", "Campaigns", "/campaigns")] },
  { pattern: "/campaigns/:campaignId", crumbs: [crumb("breadcrumb.campaigns", "Campaigns", "/campaigns"), crumb("breadcrumb.campaignDetail", "Campaign", "/campaigns/:campaignId")] },
  { pattern: "/progress", crumbs: [crumb("breadcrumb.progress", "Progress", "/progress")] },

  // ── Explore ──────────────────────────────────────────────────────
  { pattern: "/explore", crumbs: [EXPLORE_CRUMB] },
  { pattern: "/library", crumbs: [EXPLORE_CRUMB, crumb("breadcrumb.library", "Library", "/library")] },
  { pattern: "/board-games", crumbs: [EXPLORE_CRUMB, crumb("breadcrumb.boardGames", "Board Games", "/board-games")] },
  { pattern: "/video-games", crumbs: [EXPLORE_CRUMB, crumb("breadcrumb.videoGames", "Video Games", "/video-games")] },

  // ── Music ────────────────────────────────────────────────────────
  { pattern: "/music-player", crumbs: [MUSIC_CRUMB] },
  { pattern: "/playlists", crumbs: [MUSIC_CRUMB, crumb("breadcrumb.playlists", "Playlists", "/playlists")] },
  { pattern: "/playlists/:playlistId", crumbs: [MUSIC_CRUMB, crumb("breadcrumb.playlists", "Playlists", "/playlists"), crumb("breadcrumb.playlistDetail", "Playlist", "/playlists/:playlistId")] },
  { pattern: "/playlist-manager", crumbs: [MUSIC_CRUMB, crumb("breadcrumb.playlistManager", "Playlist Manager", "/playlist-manager")] },

  // ── Vendor Marketplace ───────────────────────────────────────────
  { pattern: "/vendors", crumbs: [VENDORS_CRUMB] },
  { pattern: "/vendors/:slug", crumbs: [VENDORS_CRUMB, crumb("breadcrumb.vendorDetail", "Vendor", "/vendors/:slug")] },
  { pattern: "/vendors/my-offers", crumbs: [VENDORS_CRUMB, crumb("breadcrumb.myOffers", "My Offers", "/vendors/my-offers")] },

  // ── Wiki ─────────────────────────────────────────────────────────
  { pattern: "/wiki", crumbs: [WIKI_CRUMB] },
  { pattern: "/wiki/*", crumbs: [WIKI_CRUMB, crumb("breadcrumb.wikiPage", "Page", "/wiki/*")] },

  // ── News ─────────────────────────────────────────────────────────
  { pattern: "/news", crumbs: [crumb("breadcrumb.news", "News", "/news")] },

  // ── Radio ────────────────────────────────────────────────────────
  { pattern: "/radio/external", crumbs: [crumb("breadcrumb.onlineRadio", "Online Radio", "/radio/external")] },
  { pattern: "/radio/:radioId", crumbs: [crumb("breadcrumb.radio", "Radio", "/radio/:radioId")] },
  { pattern: "/radio/invite/:token", crumbs: [crumb("breadcrumb.radioInvite", "Radio Invite", "/radio/invite/:token")] },

  // ── Wishlists ────────────────────────────────────────────────────
  { pattern: "/wishlists", crumbs: [crumb("breadcrumb.wishlists", "Wishlists", "/wishlists")] },
  { pattern: "/wishlists/shared/:token", crumbs: [crumb("breadcrumb.wishlists", "Wishlists", "/wishlists"), crumb("breadcrumb.sharedWishlist", "Shared Wishlist", "/wishlists/shared/:token")] },

  // ── Gifts ────────────────────────────────────────────────────────
  { pattern: "/gifts", crumbs: [crumb("breadcrumb.gifts", "Gift Registry", "/gifts")] },
  { pattern: "/gifts/shared/:token", crumbs: [crumb("breadcrumb.gifts", "Gift Registry", "/gifts"), crumb("breadcrumb.sharedGift", "Shared Gift", "/gifts/shared/:token")] },

  // ── Characters ───────────────────────────────────────────────────
  { pattern: "/characters", crumbs: [crumb("breadcrumb.characters", "Characters", "/characters")] },

  // ── Contacts ─────────────────────────────────────────────────────
  { pattern: "/contacts", crumbs: [crumb("breadcrumb.contacts", "Contacts", "/contacts")] },

  // ── Settings ─────────────────────────────────────────────────────
  { pattern: "/settings", crumbs: [SETTINGS_CRUMB] },
  { pattern: "/settings/controller", crumbs: [SETTINGS_CRUMB, crumb("breadcrumb.controller", "Controller", "/settings/controller")] },
  { pattern: "/settings/audio-input", crumbs: [SETTINGS_CRUMB, crumb("breadcrumb.audioInput", "Audio Input", "/settings/audio-input")] },
  { pattern: "/settings/display", crumbs: [SETTINGS_CRUMB, crumb("breadcrumb.display", "Display", "/settings/display")] },
  { pattern: "/settings/live-score", crumbs: [SETTINGS_CRUMB, crumb("breadcrumb.liveScore", "Live Score", "/settings/live-score")] },
  { pattern: "/settings/vocal-effects", crumbs: [SETTINGS_CRUMB, crumb("breadcrumb.vocalEffects", "Vocal Effects", "/settings/vocal-effects")] },
  { pattern: "/settings/linked-accounts", crumbs: [SETTINGS_CRUMB, crumb("breadcrumb.linkedAccounts", "Linked Accounts", "/settings/linked-accounts")] },
  { pattern: "/settings/youtube-subscriptions", crumbs: [SETTINGS_CRUMB, crumb("breadcrumb.youtubeSubs", "YouTube Subs", "/settings/youtube-subscriptions")] },

  // ── Create (auth) ────────────────────────────────────────────────
  { pattern: "/create/projects", crumbs: [CREATE_CRUMB] },
  { pattern: "/create/studio/:projectId", crumbs: [CREATE_CRUMB, crumb("breadcrumb.studio", "Studio", "/create/studio/:projectId")] },
  { pattern: "/karaoke-editor/projects", crumbs: [CREATE_CRUMB, crumb("breadcrumb.karaokeProjects", "Karaoke Projects", "/karaoke-editor/projects")] },
  { pattern: "/dmx-editor/projects", crumbs: [CREATE_CRUMB, crumb("breadcrumb.dmxProjects", "DMX Projects", "/dmx-editor/projects")] },

  // ── Profile (auth) ──────────────────────────────────────────────
  { pattern: "/profile", crumbs: [PROFILE_CRUMB] },
  { pattern: "/profile/change-password", crumbs: [PROFILE_CRUMB, crumb("breadcrumb.changePassword", "Change Password", "/profile/change-password")] },
  { pattern: "/profile/settings", crumbs: [PROFILE_CRUMB, crumb("breadcrumb.profileSettings", "Settings", "/profile/settings")] },
  { pattern: "/dashboard", crumbs: [crumb("breadcrumb.dashboard", "Dashboard", "/dashboard")] },
  { pattern: "/my-audit-logs", crumbs: [crumb("breadcrumb.myAuditLogs", "My Audit Logs", "/my-audit-logs")] },

  // ── Admin ────────────────────────────────────────────────────────
  { pattern: "/admin", crumbs: [ADMIN_CRUMB] },
  { pattern: "/admin/users", crumbs: [ADMIN_CRUMB, crumb("breadcrumb.users", "Users", "/admin/users")] },
  { pattern: "/admin/password-requirements", crumbs: [ADMIN_CRUMB, crumb("breadcrumb.passwordRequirements", "Password Requirements", "/admin/password-requirements")] },
  { pattern: "/admin/settings", crumbs: [ADMIN_CRUMB, crumb("breadcrumb.adminSettings", "Settings", "/admin/settings")] },
  { pattern: "/admin/scoring-presets", crumbs: [ADMIN_CRUMB, crumb("breadcrumb.scoringPresets", "Scoring Presets", "/admin/scoring-presets")] },
  { pattern: "/admin/skins", crumbs: [ADMIN_CRUMB, crumb("breadcrumb.skins", "Skins", "/admin/skins")] },
  { pattern: "/admin/otp", crumbs: [ADMIN_CRUMB, crumb("breadcrumb.otp", "OTP", "/admin/otp")] },
  { pattern: "/admin/audit-logs", crumbs: [ADMIN_CRUMB, crumb("breadcrumb.auditLogs", "Audit Logs", "/admin/audit-logs")] },
  { pattern: "/admin/login-attempts", crumbs: [ADMIN_CRUMB, crumb("breadcrumb.loginAttempts", "Login Attempts", "/admin/login-attempts")] },
  { pattern: "/admin/audit", crumbs: [ADMIN_CRUMB, crumb("breadcrumb.audit", "Audit", "/admin/audit")] },
  { pattern: "/admin/honeytokens", crumbs: [ADMIN_CRUMB, crumb("breadcrumb.honeytokens", "Honeytokens", "/admin/honeytokens")] },
  { pattern: "/admin/news-feeds", crumbs: [ADMIN_CRUMB, crumb("breadcrumb.newsFeeds", "News Feeds", "/admin/news-feeds")] },
  { pattern: "/admin/security-dashboard", crumbs: [ADMIN_CRUMB, crumb("breadcrumb.securityDashboard", "Security Dashboard", "/admin/security-dashboard")] },
];

// ── Matcher ────────────────────────────────────────────────────────

/** Convert a route pattern to a regex. */
function patternToRegex(pattern: string): RegExp {
  // Escape special chars, then replace :param with a named group and * with wildcard
  const escaped = pattern
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\\:([a-zA-Z_]+)/g, "(?<$1>[^/]+)")
    .replace(/\\\*/g, "(?<rest>.*)");
  return new RegExp(`^${escaped}$`);
}

export interface ResolvedBreadcrumb {
  label: string;
  labelKey: string;
  path: string;
}

/**
 * Resolve breadcrumbs for a given pathname.
 * Returns null if the route is hidden or not found in the registry.
 */
export function resolveBreadcrumbs(
  pathname: string,
  t: (key: string, opts?: Record<string, string>) => string,
): ResolvedBreadcrumb[] | null {
  // Check hidden first
  for (const hp of HIDDEN_PATTERNS) {
    if (patternToRegex(hp).test(pathname)) return null;
  }

  for (const route of breadcrumbRoutes) {
    const regex = patternToRegex(route.pattern);
    const match = regex.exec(pathname);
    if (!match) continue;
    if (route.hidden) return null;

    const params = match.groups ?? {};

    // Build resolved list: Home + crumbs
    const home: ResolvedBreadcrumb = {
      label: t("breadcrumb.home", { defaultValue: "Home" }),
      labelKey: "breadcrumb.home",
      path: "/",
    };

    const resolved: ResolvedBreadcrumb[] = [home];
    for (const c of route.crumbs) {
      let resolvedPath = c.path;
      // Replace :param placeholders with actual values
      for (const [key, value] of Object.entries(params)) {
        resolvedPath = resolvedPath.replace(`:${key}`, value);
      }
      // Replace * with rest
      if (params.rest !== undefined) {
        resolvedPath = resolvedPath.replace("*", params.rest);
      }
      resolved.push({
        label: t(c.labelKey, { defaultValue: c.labelDefault }),
        labelKey: c.labelKey,
        path: resolvedPath,
      });
    }

    return resolved;
  }

  // Not in registry — return a simple fallback
  return null;
}

/** Get all registered route patterns (for admin/debug/index). */
export function getAllBreadcrumbRoutes() {
  return breadcrumbRoutes.map(r => ({
    pattern: r.pattern,
    crumbs: r.crumbs,
    hidden: r.hidden ?? false,
  }));
}
