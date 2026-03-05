import React from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import RootLayout from "./layouts/RootLayout";
import AuthLayout from "./layouts/AuthLayout";
import AdminLayout from "./layouts/AdminLayout";
import ErrorPage from "./components/ErrorPage";
import PageSpinner from "./components/common/PageSpinner";
import './App.css';
import './AppTheme.css';

/**
 * Shown while React Router resolves the initial lazy route bundle.
 * After 12 s without progress the user is offered a hard-reload
 * (handles stale Service Worker caches, interrupted chunk downloads, etc).
 */
const RouterHydrateFallback: React.FC = () => {
    const [timedOut, setTimedOut] = React.useState(false);
    React.useEffect(() => {
        const t = setTimeout(() => setTimedOut(true), 12_000);
        return () => clearTimeout(t);
    }, []);

    if (timedOut) {
        return (
            <div
                style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', height: '100vh', gap: '1rem',
                    color: 'var(--text-secondary, #9ca3af)', fontFamily: 'sans-serif',
                    textAlign: 'center', padding: '2rem',
                }}
            >
                <p style={{ fontSize: '1.1rem' }}>Loading is taking longer than expected...</p>
                <button
                    onClick={() => { caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k)))).finally(() => window.location.reload()); }}
                    style={{
                        padding: '0.6rem 1.4rem', cursor: 'pointer', borderRadius: 6,
                        background: 'var(--accent, #3b82f6)', color: '#fff',
                        border: 'none', fontSize: '1rem',
                    }}
                >
                    Clear cache &amp; reload
                </button>
            </div>
        );
    }

    return <PageSpinner />;
};

// ── Helper: wrap default-export page module for React Router lazy ──
// On chunk load failure (stale deploy), force a full page reload once.
type PageModule = { default: React.ComponentType };
const page = (importFn: () => Promise<PageModule>) => ({
    lazy: () => importFn()
        .then(m => ({ Component: m.default }))
        .catch((err: Error) => {
            if (
                err.name === 'ChunkLoadError' ||
                err.message?.includes('Failed to fetch dynamically imported module') ||
                err.message?.includes('Loading chunk')
            ) {
                const reloadKey = 'av_chunk_reload';
                if (!sessionStorage.getItem(reloadKey)) {
                    sessionStorage.setItem(reloadKey, '1');
                    window.location.reload();
                } else {
                    sessionStorage.removeItem(reloadKey);
                }
            }
            throw err;
        }),
});

// ── Route configuration ────────────────────────────────────────────
export const router = createBrowserRouter([
    {
        element: <RootLayout />,
        HydrateFallback: RouterHydrateFallback,
        errorElement: <ErrorPage />,
        children: [
            // ── Public routes ──────────────────────────────────────
            { path: "/", ...page(() => import("./pages/HomePage")) },
            { path: "/login", ...page(() => import("./pages/auth/LoginPage")) },
            { path: "/register", ...page(() => import("./pages/RegisterPage")) },
            { path: "/first-login-password-change", ...page(() => import("./pages/auth/FirstLoginPasswordChangePage")) },
            { path: "/spotifyCallback", ...page(() => import("./pages/auth/SpotifyCallbackPage")) },
            { path: "/twitchCallback", ...page(() => import("./pages/auth/TwitchCallbackPage")) },
            { path: "/googleCallback", ...page(() => import("./pages/auth/GoogleCallbackPage")) },
            { path: "/youtubeCallback", ...page(() => import("./pages/auth/YouTubeCallbackPage")) },
            { path: "/tidalCallback", ...page(() => import("./pages/auth/TidalCallbackPage")) },
            { path: "/microsoftCallback", ...page(() => import("./pages/auth/MicrosoftCallbackPage")) },
            { path: "/discordCallback", ...page(() => import("./pages/auth/DiscordCallbackPage")) },
            { path: "/features", ...page(() => import("./pages/FeaturesPage")) },

            // Party / Play
            { path: "/play", ...page(() => import("./pages/play/PlayPage")) },
            { path: "/parties", ...page(() => import("./pages/party/PartiesPage")) },
            { path: "/parties/:partyId", ...page(() => import("./pages/party/PartyPage")) },
            { path: "/parties/:partyId/details", ...page(() => import("./pages/party/EventDetailPage")) },
            { path: "/songs", ...page(() => import("./pages/party/KaraokeSongBrowserPage")) },
            { path: "/quick-karaoke", ...page(() => import("./pages/party/QuickKaraokeJoinPage")) },
            { path: "/karaoke-playlists", ...page(() => import("./pages/party/KaraokePlaylistPage")) },
            { path: "/rounds", ...page(() => import("./pages/party/KaraokeRoundPage")) },
            { path: "/ranking", ...page(() => import("./pages/party/KaraokeRankingPage")) },
            { path: "/dance", ...page(() => import("./pages/party/DancePage")) },
            { path: "/my-event-lists", ...page(() => import("./pages/party/EventListsPage")) },
            { path: "/my-subscriptions", ...page(() => import("./pages/party/EventSubscriptionsPage")) },
            { path: "/event-lists/shared/:token", ...page(() => import("./pages/party/SharedEventListPage")) },
            { path: "/hit-that-note", ...page(() => import("./components/games/HitThatNote")) },
            { path: "/join", ...page(() => import("./pages/party/JoinPartyPage")) },
            { path: "/join/:partyId", ...page(() => import("./pages/party/JoinPartyPage")) },
            { path: "/jam-session", ...page(() => import("./pages/play/JamSessionPage")) },

            // Campaigns
            { path: "/campaigns", ...page(() => import("./pages/campaign/CampaignsPage")) },
            { path: "/campaigns/:campaignId", ...page(() => import("./pages/campaign/CampaignDetailPage")) },
            { path: "/progress", ...page(() => import("./pages/campaign/PlayerProgressPage")) },

            // Explore
            { path: "/explore", ...page(() => import("./pages/explore/ExplorePage")) },
            { path: "/library", ...page(() => import("./pages/explore/LibraryPage")) },
            { path: "/board-games", ...page(() => import("./pages/explore/BoardGameCollectionPage")) },
            { path: "/video-games", ...page(() => import("./pages/explore/VideoGamesCollectionPage.tsx")) },
            { path: "/video-games/steam-import", ...page(() => import("./pages/explore/SteamCollectionImportPage")) },
            { path: "/organizations", ...page(() => import("./pages/explore/OrganizationsPage")) },
            { path: "/leagues", ...page(() => import("./pages/explore/LeaguesPage")) },
            { path: "/betting", ...page(() => import("./pages/explore/BettingPage")) },
            { path: "/events-manager", ...page(() => import("./pages/explore/EventsManagerPage")) },
            { path: "/books", ...page(() => import("./pages/explore/BookCatalogPage")) },
            { path: "/library-catalog", ...page(() => import("./pages/explore/LibraryCatalogPage")) },
            { path: "/library-catalog/songs/:songId", ...page(() => import("./pages/explore/SongDetailPage")) },
            { path: "/library-catalog/albums/:albumId", ...page(() => import("./pages/explore/AlbumDetailPage")) },
            { path: "/library-catalog/artists/:artistId", ...page(() => import("./pages/explore/ArtistDetailPage")) },

            // Media
            { path: "/media/books", ...page(() => import("./pages/media/BooksPage")) },
            { path: "/media/movies", ...page(() => import("./pages/media/MoviesPage")) },
            { path: "/media/tv", ...page(() => import("./pages/media/TvShowsPage")) },
            { path: "/media/sports", ...page(() => import("./pages/media/SportsPage")) },

            // Games
            { path: "/mini-games/*", ...page(() => import("./pages/games/MiniGamesRouter")) },
            { path: "/honest-living/*", ...page(() => import("./pages/games/HonestLivingPage")) },

            // Music
            { path: "/music-player", ...page(() => import("./pages/enjoy/MusicPlayerPage")) },
            { path: "/playlists", ...page(() => import("./pages/enjoy/PlaylistsPage")) },
            { path: "/playlists/:playlistId", ...page(() => import("./pages/enjoy/PlaylistDetailsPage")) },
            { path: "/playlist-manager", ...page(() => import("./pages/enjoy/PlaylistManagerPage")) },
            { path: "/playlist-import", ...page(() => import("./pages/enjoy/PlaylistImportWizardPage")) },

            // Vendor Marketplace
            { path: "/vendors", ...page(() => import("./pages/vendors/VendorMarketplacePage")) },
            { path: "/vendors/:slug", ...page(() => import("./pages/vendors/VendorDetailPage")) },

            // Locations / Map
            { path: "/locations", ...page(() => import("./pages/locations/LocationExplorerPage")) },

            // Wiki
            { path: "/wiki", ...page(() => import("./pages/wiki/WikiPage")) },
            { path: "/wiki/*", ...page(() => import("./pages/wiki/WikiPage")) },

            // Thesis
            { path: "/thesis", ...page(() => import("./pages/thesis/ThesisPage")) },

            // News
            { path: "/news", ...page(() => import("./pages/news/NewsPage")) },

            // Radio
            { path: "/radio/:radioId", ...page(() => import("./pages/radio/RadioPage")) },
            { path: "/radio/invite/:token", ...page(() => import("./pages/radio/RadioInvitePage")) },
            { path: "/radio/external", ...page(() => import("./pages/radio/ExternalRadioPage")) },

            // Wishlists
            { path: "/wishlists", ...page(() => import("./pages/wishlists/WishlistsPage")) },
            { path: "/wishlists/shared/:token", ...page(() => import("./pages/wishlists/SharedWishlistPage")) },

            // Gift Registry
            { path: "/gifts", ...page(() => import("./pages/gifts/GiftRegistryPage")) },
            { path: "/gifts/shared/:token", ...page(() => import("./pages/gifts/SharedGiftRegistryPage")) },

            // Characters (public)
            { path: "/characters", ...page(() => import("./pages/create/AnimatedPersonsPage")) },

            // Settings (public)
            { path: "/settings", ...page(() => import("./pages/settings/SettingsPage")) },
            { path: "/settings/controller", ...page(() => import("./pages/settings/ControllerPage")) },
            { path: "/settings/audio-input", ...page(() => import("./pages/settings/AudioSettingsPage")) },
            { path: "/settings/display", ...page(() => import("./pages/settings/DisplaySettingsPage")) },
            { path: "/settings/live-score", ...page(() => import("./pages/settings/LiveScorePage")) },
            { path: "/settings/vocal-effects", ...page(() => import("./pages/settings/VocalEffectsPage")) },
            { path: "/settings/linked-accounts", ...page(() => import("./pages/settings/LinkedAccountsPage")) },
            { path: "/settings/youtube-subscriptions", ...page(() => import("./pages/settings/YouTubeSubscriptionsPage")) },

            // Dev tools
            { path: "/tuning-harness", ...page(() => import("./pages/TuningHarnessPage")) },

            // Karaoke editor (public — no auth required)
            { path: "/karaoke-editor/projects", ...page(() => import("./pages/create/KaraokeProjectsPage")) },
            { path: "/karaoke-editor", ...page(() => import("./pages/KaraokeEditorPage")) },
            { path: "/karaoke-editor/:songIdParam", ...page(() => import("./pages/KaraokeEditorPage")) },

            // ── Auth-required routes (layout guard) ────────────────
            {
                element: <AuthLayout />,
                children: [
                    // Contacts & Address Book
                    { path: "/contacts", ...page(() => import("./pages/contacts/ContactsPage")) },
                    // Vendor — my received offers
                    { path: "/vendors/my-offers", ...page(() => import("./pages/vendors/VendorMyOffersPage")) },
                    // Create
                    { path: "/create/projects", ...page(() => import("./pages/create/ProjectsPage")) },
                    { path: "/create/studio/:projectId", ...page(() => import("./pages/create/AudioEditorPage")) },
                    { path: "/dmx-editor/projects", ...page(() => import("./pages/dmx/DmxProjectsPage")) },
                    { path: "/dmx-editor", ...page(() => import("./pages/dmx/DmxEditorPage")) },

                    // Profile & Dashboard
                    { path: "/profile", ...page(() => import("./pages/profile/ProfilePage")) },
                    { path: "/profile/change-password", ...page(() => import("./pages/profile/ChangePasswordPage")) },
                    { path: "/profile/settings", ...page(() => import("./pages/profile/UserProfileSettingsPage")) },
                    { path: "/profile/players", ...page(() => import("./pages/profile/PlayersPage")) },
                    { path: "/dashboard", ...page(() => import("./pages/dashboard/Dashboard")) },
                    { path: "/karaoke-stats", ...page(() => import("./pages/dashboard/KaraokeStatsPage")) },
                    { path: "/library-stats", ...page(() => import("./pages/dashboard/LibraryStatsPage")) },
                    { path: "/event-calendar", ...page(() => import("./pages/dashboard/EventCalendarPage")) },
                    { path: "/my-audit-logs", ...page(() => import("./pages/dashboard/MyAuditLogsPage")) },
                ],
            },

            // ── Admin routes (layout guard) ────────────────────────
            {
                element: <AdminLayout />,
                children: [
                    { path: "/admin", ...page(() => import("./pages/admin/AdminDashboard")) },
                    { path: "/admin/users", ...page(() => import("./pages/admin/AdminUsersPage")) },
                    { path: "/admin/password-requirements", ...page(() => import("./pages/admin/AdminPasswordRequirementsPage")) },
                    { path: "/admin/settings", ...page(() => import("./pages/admin/AdminSettingsPage")) },
                    { path: "/admin/scoring-presets", ...page(() => import("./pages/admin/AdminScoringPresetsPage")) },
                    { path: "/admin/skins", ...page(() => import("./pages/admin/AdminSkinsPage")) },
                    { path: "/admin/otp", ...page(() => import("./pages/admin/OtpManagementPage")) },
                    { path: "/admin/audit-logs", ...page(() => import("./pages/admin/AuditLogsPage")) },
                    { path: "/admin/login-attempts", ...page(() => import("./pages/admin/LoginAttemptsPage")) },
                    { path: "/admin/audit", ...page(() => import("./pages/admin/AdminAuditDashboard")) },
                    { path: "/admin/honeytokens", ...page(() => import("./pages/admin/HoneyTokenDashboard")) },
                    { path: "/admin/news-feeds", ...page(() => import("./pages/admin/NewsFeedsAdminPage")) },
                    { path: "/admin/asset-manager", ...page(() => import("./pages/admin/AdminAssetManagerPage")) },
                    { path: "/admin/feature-visibility", ...page(() => import("./pages/admin/FeatureVisibilityPage")) },
                    { path: "/admin/notifications", ...page(() => import("./pages/admin/AdminNotificationsPage")) },
                    { path: "/admin/security-dashboard", ...page(() => import("./pages/dashboard/SecurityDashboard")) },
                    { path: "/admin/moderation", ...page(() => import("./pages/admin/AdminModerationPage")) },
                    { path: "/admin/integrations", ...page(() => import("./pages/admin/AdminIntegrationsPage")) },
                    { path: "/admin/diagrams", ...page(() => import("./pages/admin/DataModelDiagram")) },
                    { path: "/admin/diagram-gallery", ...page(() => import("./pages/admin/DiagramsGalleryPage")) },
                    { path: "/admin/lab", ...page(() => import("./pages/lab/LaboratoryPage")) },
                ],
            },

            // 404 catch-all
            { path: "*", ...page(() => import("./pages/NotFoundPage")) },
        ],
    },
]);

// ── App component ──────────────────────────────────────────────────
const App: React.FC = () => (
    <RouterProvider router={router} />
);

export default App;
