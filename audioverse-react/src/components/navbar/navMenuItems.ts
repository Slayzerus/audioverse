import type { NavMenuEntry } from "./NavDropdownMenu";
import React from "react";

/**
 * Data-driven menu item definitions for the Navbar dropdowns.
 * Each config can be used with the NavDropdownMenu component.
 */

export const musicItems: NavMenuEntry[] = [
    { id: "explore", labelKey: "nav.explore", to: "/explore" },
    { id: "library", labelKey: "nav.library", to: "/library" },
    { id: "player", labelKey: "nav.musicPlayer", to: "/music-player" },
    { id: "playlist-manager", labelKey: "nav.playlistManager", to: "/playlist-manager" },
    { id: "songs", labelKey: "nav.songs", to: "/songs" },
    { id: "playlists", labelKey: "nav.playlists", to: "/karaoke-playlists" },
    { type: "divider" },
    { id: "books", labelKey: "nav.books", labelDefault: "Books", to: "/media/books" },
    { id: "movies", labelKey: "nav.movies", labelDefault: "Movies", to: "/media/movies" },
    { id: "tv-shows", labelKey: "nav.tvShows", labelDefault: "TV Shows", to: "/media/tv" },
    { id: "sports", labelKey: "nav.sports", labelDefault: "Sports", to: "/media/sports" },
];

/** Games items factory — needs handleQuickKaraoke callback */
export function gamesItems(handleQuickKaraoke: () => void): NavMenuEntry[] {
    return [
        { id: "karaoke", labelKey: "nav.quickKaraoke", labelDefault: "Quick Karaoke", onClick: handleQuickKaraoke },
        { id: "ranking", labelKey: "nav.ranking", labelDefault: "Ranking", to: "/ranking" },
        { id: "campaigns", labelKey: "nav.campaigns", labelDefault: "Campaigns", to: "/campaigns" },
        { type: "divider" },
        { id: "play", labelKey: "nav.playHub", to: "/play" },
        { id: "dance", labelKey: "nav.dance", to: "/dance" },
        { id: "board-games", labelKey: "nav.boardGames", to: "/board-games" },
        { id: "video-games", labelKey: "nav.videoGames", to: "/video-games" },
        { id: "mini-games", labelKey: "nav.miniGames", labelDefault: "Mini Games", to: "/mini-games" },
        { id: "jam-session", labelKey: "nav.jamSession", labelDefault: "Jam Session", to: "/jam-session" },
        { type: "divider" },
        { id: "betting", labelKey: "nav.betting", labelDefault: "Betting", to: "/betting" },
    ];
}

export const createItems: NavMenuEntry[] = [
    { id: "projects", labelKey: "nav.projects", to: "/create/projects" },
    { id: "karaoke-editor", labelKey: "nav.karaokeEditor", to: "/karaoke-editor/projects" },
    { id: "dmx-editor", labelKey: "nav.dmxEditor", to: "/dmx-editor/projects" },
];

export const socialItems: NavMenuEntry[] = [
    { id: "parties", labelKey: "nav.parties", to: "/parties" },
    { id: "contacts", labelKey: "nav.contacts", labelDefault: "Contacts", to: "/contacts" },
    { type: "divider" },
    { id: "news", labelKey: "nav.news", labelDefault: "News", to: "/news" },
    { id: "external-radio", labelKey: "nav.externalRadio", labelDefault: "Online Radio", to: "/radio/external" },
    { type: "divider" },
    { id: "wishlists", labelKey: "nav.wishlists", labelDefault: "Wishlists", to: "/wishlists" },
    { id: "gifts", labelKey: "nav.gifts", labelDefault: "Gift Registry", to: "/gifts" },
    { type: "divider" },
    { id: "vendors", labelKey: "nav.vendorMarketplace", labelDefault: "Vendor Marketplace", to: "/vendors" },
    { id: "my-offers", labelKey: "nav.myOffers", labelDefault: "My Offers", to: "/vendors/my-offers" },
    { type: "divider" },
    { id: "locations", labelKey: "nav.locations", labelDefault: "Locations & Map", to: "/locations" },
    { id: "organizations", labelKey: "nav.organizations", labelDefault: "Organizations", to: "/organizations" },
    { id: "leagues", labelKey: "nav.leagues", labelDefault: "Leagues", to: "/leagues" },
];

export const adminItems: NavMenuEntry[] = [
    { id: "dashboard", labelKey: "nav.dashboard", to: "/admin" },
    { id: "audit", labelKey: "nav.audit", to: "/admin/audit" },
    { id: "users", labelKey: "nav.users", to: "/admin/users" },
    { id: "settings", labelKey: "nav.settings", to: "/admin/settings" },
    { id: "password-requirements", labelKey: "nav.passwordRequirements", to: "/admin/password-requirements" },
    { id: "scoring-presets", labelKey: "nav.scoringPresets", to: "/admin/scoring-presets" },
    { id: "skins", labelKey: "nav.skins", to: "/admin/skins" },
    { id: "honeytokens", labelKey: "nav.honeyTokens", to: "/admin/honeytokens" },
    { type: "divider" },
    { id: "otp", labelKey: "nav.otp", to: "/admin/otp" },
    { id: "audit-logs", labelKey: "nav.auditLogs", to: "/admin/audit-logs" },
    { id: "login-attempts", labelKey: "nav.loginAttempts", to: "/admin/login-attempts" },
    { type: "divider" },
    { id: "security-dashboard", labelKey: "nav.securityDashboard", to: "/admin/security-dashboard" },
    { id: "moderation", labelKey: "nav.moderation", labelDefault: "Moderation", to: "/admin/moderation" },
    { id: "news-feeds", labelKey: "nav.newsFeeds", labelDefault: "News Feeds", to: "/admin/news-feeds" },
    { id: "characters", labelKey: "nav.characters", to: "/characters" },
    { id: "wiki-admin", labelKey: "nav.wikiAdmin", labelDefault: "Wiki — manage pages", to: "/wiki" },
    { type: "divider" },
    { id: "feature-visibility", labelKey: "nav.featureVisibility", labelDefault: "Feature Visibility", to: "/admin/feature-visibility" },
    { type: "divider" },
    { id: "notifications", labelKey: "nav.notifications", labelDefault: "Powiadomienia", to: "/admin/notifications" },
    { id: "asset-manager", labelKey: "nav.assetManager", labelDefault: "Asset Manager", to: "/admin/asset-manager" },
    { type: "divider" },
    { id: "laboratory", labelKey: "nav.laboratory", labelDefault: "Laboratory", to: "/admin/lab" },
    { type: "divider" },
    { id: "diagrams", labelKey: "nav.diagrams", labelDefault: "Diagrams", to: "/admin/diagrams" },
    { id: "diagram-gallery", labelKey: "nav.diagramGallery", labelDefault: "Diagram Gallery", to: "/admin/diagram-gallery" },
    { type: "divider" },
    { id: "events-manager", labelKey: "nav.eventsManager", labelDefault: "Events Manager", to: "/events-manager" },
    { id: "library-catalog", labelKey: "nav.libraryCatalog", labelDefault: "Library Catalog", to: "/library-catalog" },
];

export const profileItems: NavMenuEntry[] = [
    { id: "profile", labelKey: "nav.profile", to: "/profile" },
    { id: "players", labelKey: "nav.players", labelDefault: "Players", to: "/profile/players" },
    { id: "dashboard", labelKey: "nav.dashboard", to: "/dashboard" },
    { id: "progress", labelKey: "nav.progress", labelDefault: "Progress", to: "/progress" },
    { id: "settings", labelKey: "nav.profileSettings", to: "/profile/settings" },
    { id: "change-password", labelKey: "nav.changePassword", to: "/profile/change-password" },
    { id: "audit-logs", labelKey: "nav.myAuditLogs", to: "/my-audit-logs" },
    { type: "divider" },
    { id: "wiki", labelKey: "nav.wiki", labelDefault: "Wiki / Docs", to: "/wiki" },
    { id: "thesis", labelKey: "nav.thesis", labelDefault: "Praca dyplomowa", to: "/thesis" },
];

/** Settings items factory — needs handleResetTutorials callback and icon */
export function settingsItems(handleResetTutorials: () => void, resetIcon: React.ReactNode): NavMenuEntry[] {
    return [
        { id: "settings", labelKey: "nav.settings", to: "/settings" },
        { id: "controller", labelKey: "nav.controller", to: "/settings/controller" },
        { id: "audio-input", labelKey: "nav.audioInput", to: "/settings/audio-input" },
        { id: "linked-accounts", labelKey: "nav.linkedAccounts", labelDefault: "Linked Accounts", to: "/settings/linked-accounts" },
        { id: "youtube-subs", labelKey: "nav.youtubeSubs", labelDefault: "YouTube Subscriptions", to: "/settings/youtube-subscriptions" },
        { type: "divider" },
        { id: "features", labelKey: "nav.features", labelDefault: "Features", to: "/features" },
        { id: "reset-tutorials", labelKey: "nav.resetTutorials", onClick: handleResetTutorials, icon: resetIcon },
    ];
}
