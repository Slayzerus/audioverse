using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using AudioVerse.Domain.Entities.Editor;
using System.Reflection;
// Event entity removed - use Events instead
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Entities.UserProfiles;
using AudioVerse.Domain.Entities.Design;
using AudioVerse.Domain.Entities.Auth;
using AudioVerse.Domain.Entities.Admin;
using AudioVerse.Domain.Entities.Dmx;
using AudioVerse.Domain.Entities.Audio;
using AudioVerse.Domain.Entities.Karaoke.KaraokeSongFiles;
using AudioVerse.Domain.Entities.Karaoke.KaraokeSingings;
using AudioVerse.Domain.Entities.Karaoke.KaraokePlayLists;
using AudioVerse.Domain.Entities.Karaoke.KaraokeTeams;
using AudioVerse.Domain.Entities.Games;
using AudioVerse.Domain.Entities.Karaoke.KaraokeSessions;
using AudioVerse.Domain.Entities.Contacts;

namespace AudioVerse.Infrastructure.Persistence
{
    public class AudioVerseDbContext : IdentityDbContext<
        UserProfile,
        IdentityRole<int>,
        int,
        IdentityUserClaim<int>,
        IdentityUserRole<int>,
        IdentityUserLogin<int>,
        IdentityRoleClaim<int>,
        IdentityUserToken<int>>
    {
        public AudioVerseDbContext(DbContextOptions<AudioVerseDbContext> options) : base(options) { }

        public DbSet<UserProfile> UserProfiles { get; set; }
        public DbSet<UserProfilePlayer> UserProfilePlayers { get; set; }
        public DbSet<PlayerLink> PlayerLinks { get; set; }
        public DbSet<PasswordHistory> PasswordHistory { get; set; }
        public DbSet<PasswordRequirements> PasswordRequirements { get; set; }
        public DbSet<AuditLog> AuditLogs { get; set; }
        public DbSet<AudioVerse.Domain.Entities.EntityChangeLog> EntityChangeLogs { get; set; }
        public DbSet<OneTimePassword> OneTimePasswords { get; set; }
        public DbSet<LoginAttempt> LoginAttempts { get; set; }
        public DbSet<Captcha> Captchas { get; set; }
        public DbSet<HoneyToken> HoneyTokens { get; set; }
        public DbSet<SystemConfiguration> SystemConfigurations { get; set; }
        public DbSet<FeatureVisibilityOverride> FeatureVisibilityOverrides { get; set; }
        public DbSet<ScoringPreset> AdminScoringPresets { get; set; }
        public DbSet<WikiPage> WikiPages { get; set; }
        public DbSet<WikiPageRevision> WikiPageRevisions { get; set; }
        public DbSet<SkinTheme> SkinThemes { get; set; }
        public DbSet<UserProfileDevice> UserDevices { get; set; }
        public DbSet<UserProfileMicrophone> UserMicrophones { get; set; }
        public DbSet<MicrophoneAssignment> MicrophoneAssignments { get; set; }



        // 'Event' removed — use Events table instead
        public DbSet<Event> Events { get; set; }
        public DbSet<KaraokeSongFile> KaraokeSongs { get; set; }
        public DbSet<KaraokePlaylist> KaraokePlaylists { get; set; }
        public DbSet<KaraokeSessionPlayer> KaraokeEventPlayers { get; set; }
        public DbSet<KaraokeSessionRound> KaraokeEventRounds { get; set; }
        public DbSet<KaraokeSinging> KaraokeSingings { get; set; }
        public DbSet<KaraokeSession> KaraokeSessions { get; set; }
        public DbSet<KaraokeSessionRoundPart> KaraokeRoundParts { get; set; }
        public DbSet<KaraokeSessionRoundPartPlayer> KaraokeRoundPartPlayers { get; set; }
        public DbSet<KaraokeSessionRoundPlayer> KaraokeRoundPlayers { get; set; }
        public DbSet<KaraokeSessionSongPick> KaraokeSessionSongPicks { get; set; }
        public DbSet<KaraokeSessionSongSignup> KaraokeSessionSongSignups { get; set; }
        public DbSet<KaraokeTeam> KaraokeTeams { get; set; }
        public DbSet<KaraokeTeamPlayer> KaraokeTeamPlayers { get; set; }
        public DbSet<KaraokeSongFileQueueItem> KaraokeSongQueueItems { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Karaoke.LaboratoryExperiment> LaboratoryExperiments { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Karaoke.LaboratoryExperimentSample> LaboratoryExperimentSamples { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Karaoke.KaraokeFavoriteSong> FavoriteSongs { get; set; }
        public DbSet<KaraokeSongFileCollaborator> KaraokeSongCollaborators { get; set; }
        public DbSet<KaraokeSongFileHistory> KaraokeSongFileHistories { get; set; }
        public DbSet<EventInvite> EventInvites { get; set; }

        // Event sub-entities
        public DbSet<EventScheduleItem> EventScheduleItems { get; set; }
        public DbSet<EventMenuItem> EventMenuItems { get; set; }
        public DbSet<EventAttraction> EventAttractions { get; set; }
        public DbSet<EventTab> EventTabs { get; set; }
        public DbSet<BoardGame> BoardGames { get; set; }
        public DbSet<EventBoardGameSession> EventBoardGames { get; set; }
        public DbSet<VideoGame> VideoGames { get; set; }
        public DbSet<EventVideoGameSession> EventVideoGames { get; set; }
        // Board game collections / sessions
        public DbSet<AudioVerse.Domain.Entities.Games.BoardGameCollection> BoardGameCollections { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Games.BoardGameCollectionBoardGame> BoardGameCollectionBoardGames { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Games.BoardGameSession> BoardGameSessions { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Games.BoardGameSessionRound> BoardGameSessionRounds { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Games.BoardGameSessionRoundPart> BoardGameSessionRoundParts { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Games.BoardGameSessionRoundPartPlayer> BoardGameSessionRoundPartPlayers { get; set; }
        // BGG sync tracking
        public DbSet<AudioVerse.Domain.Entities.Games.BggSyncStatus> BggSyncStatuses { get; set; }
        // Couch game collections / sessions
        public DbSet<AudioVerse.Domain.Entities.Games.VideoGameSession> VideoGameSessions { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Games.VideoGameSessionPlayer> VideoGameSessionPlayers { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Games.VideoGameSessionRound> VideoGameSessionRounds { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Games.VideoGameSessionRoundPart> VideoGameSessionRoundParts { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Games.VideoGameSessionRoundPartPlayer> VideoGameSessionRoundPartPlayers { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Games.VideoGameCollection> VideoGameCollections { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Games.VideoGameCollectionVideoGame> VideoGameCollectionVideoGames { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Games.VideoGameGenre> VideoGameGenres { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Games.BoardGameGenre> BoardGameGenres { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Games.BoardGameTag> BoardGameTags { get; set; }

        // ── Mini-Games ──
        public DbSet<AudioVerse.Domain.Entities.Games.MiniGameSession> MiniGameSessions { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Games.MiniGameRound> MiniGameRounds { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Games.MiniGameRoundPlayer> MiniGameRoundPlayers { get; set; }

        // ── AvGame catalog ──
        public DbSet<AudioVerse.Domain.Entities.Games.AvGame> AvGames { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Games.AvGameMode> AvGameModes { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Games.AvGameConfiguration> AvGameConfigurations { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Games.AvGameSettings> AvGameSettings { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Games.AvGameAsset> AvGameAssets { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Games.AvGameSave> AvGameSaves { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Games.AvGameAchievement> AvGameAchievements { get; set; }

        // ── Social (universal ratings, tags, comments, lists) ──
        public DbSet<AudioVerse.Domain.Entities.Social.UserRating> UserRatings { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Social.RatingAggregate> RatingAggregates { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Social.UserTag> UserTags { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Social.UserComment> UserComments { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Social.UserCommentReaction> UserCommentReactions { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Social.UserListEntry> UserListEntries { get; set; }

        // Wishlists & Gift Registries
        public DbSet<AudioVerse.Domain.Entities.Wishlists.Wishlist> Wishlists { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Wishlists.WishlistItem> WishlistItems { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Wishlists.GiftRegistry> GiftRegistries { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Wishlists.GiftRegistryItem> GiftRegistryItems { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Wishlists.GiftContribution> GiftContributions { get; set; }

        // Media catalog (Movies, TV Shows, Books, Sports)
        public DbSet<AudioVerse.Domain.Entities.Media.Movie> Movies { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Media.MovieGenre> MovieGenres { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Media.MovieTag> MovieTags { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Media.MovieCollection> MovieCollections { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Media.MovieCollectionMovie> MovieCollectionMovies { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Media.TvShow> TvShows { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Media.TvShowGenre> TvShowGenres { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Media.TvShowTag> TvShowTags { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Media.TvShowCollection> TvShowCollections { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Media.TvShowCollectionTvShow> TvShowCollectionTvShows { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Media.Book> Books { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Media.BookGenre> BookGenres { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Media.BookTag> BookTags { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Media.BookCollection> BookCollections { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Media.BookCollectionBook> BookCollectionBooks { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Media.SportActivity> SportActivities { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Media.SportGenre> SportGenres { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Media.SportTag> SportTags { get; set; }

        // Organizations, Leagues, Fantasy
        public DbSet<AudioVerse.Domain.Entities.Events.Organization> Organizations { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Events.League> Leagues { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Events.LeagueEvent> LeagueEvents { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Events.LeagueParticipant> LeagueParticipants { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Events.FantasyTeam> FantasyTeams { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Events.FantasyTeamPlayer> FantasyTeamPlayers { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Events.EventList> EventLists { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Events.EventListItem> EventListItems { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Events.EventSubscription> EventSubscriptions { get; set; }

        // Vendor Marketplace
        public DbSet<AudioVerse.Domain.Entities.Vendors.VendorProfile> VendorProfiles { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Vendors.VendorPriceListItem> VendorPriceListItems { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Vendors.VendorMenuItem> VendorMenuItems { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Vendors.VendorPortfolioItem> VendorPortfolioItems { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Vendors.VendorReview> VendorReviews { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Vendors.VendorInquiry> VendorInquiries { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Vendors.VendorOffer> VendorOffers { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Vendors.VendorOfferItem> VendorOfferItems { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Vendors.EventVendor> EventVendors { get; set; }

        // Betting
        public DbSet<AudioVerse.Domain.Entities.Events.BettingMarket> BettingMarkets { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Events.BettingOption> BettingOptions { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Events.Bet> Bets { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Events.VirtualWallet> VirtualWallets { get; set; }

        // Photos & Comments & Videos & Media Tags & Collections & Collages
        public DbSet<AudioVerse.Domain.Entities.Events.EventPhoto> EventPhotos { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Events.EventVideo> EventVideos { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Events.EventMediaTag> EventMediaTags { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Events.EventMediaCollection> EventMediaCollections { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Events.EventCollage> EventCollages { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Events.EventCollageItem> EventCollageItems { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Events.EventComment> EventComments { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Events.EventInviteTemplate> EventInviteTemplates { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Events.BulkInviteJob> BulkInviteJobs { get; set; }

        // Polls
        public DbSet<EventPoll> EventPolls { get; set; }
        public DbSet<EventPollOption> EventPollOptions { get; set; }
        public DbSet<EventPollResponse> EventPollResponses { get; set; }

        // Billing
        public DbSet<EventExpense> EventExpenses { get; set; }
        public DbSet<EventExpenseShare> EventExpenseShares { get; set; }
        public DbSet<EventPayment> EventPayments { get; set; }

        public DbSet<UserBan> UserBans { get; set; }

        // DMX scenes
        public DbSet<DmxScene> DmxScenes { get; set; }
        public DbSet<DmxSceneSequence> DmxSceneSequences { get; set; }
        public DbSet<DmxSceneStep> DmxSceneSteps { get; set; }

        public DbSet<AudioProject> AudioProjects { get; set; }
        public DbSet<AudioSection> AudioSections { get; set; }
        public DbSet<AudioLayer> AudioLayers { get; set; }
        public DbSet<AudioLayerItem> AudioLayerItems { get; set; }
        public DbSet<AudioClip> AudioClips { get; set; }
        public DbSet<AudioClipTag> AudioClipTags { get; set; }
        public DbSet<AudioInputPreset> AudioInputPresets { get; set; }
        public DbSet<AudioInputMapping> AudioInputMappings { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Editor.AudioEffect> AudioEffects { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Editor.AudioLayerEffect> AudioLayerEffects { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Editor.AudioProjectCollaborator> AudioProjectCollaborators { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Editor.AudioExportTask> AudioExportTasks { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Editor.AudioSamplePack> AudioSamplePacks { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Editor.AudioSample> AudioSamples { get; set; }

        // ── MediaLibrary ──
        public DbSet<Song> LibrarySongs { get; set; }
        public DbSet<SongDetail> LibrarySongDetails { get; set; }
        public DbSet<Artist> LibraryArtists { get; set; }
        public DbSet<ArtistDetail> LibraryArtistDetails { get; set; }
        public DbSet<ArtistFact> LibraryArtistFacts { get; set; }
        public DbSet<Album> LibraryAlbums { get; set; }
        public DbSet<AlbumArtist> LibraryAlbumArtists { get; set; }
        // Legacy names used by APIs: keep DbSet aliases to maintain compilation
        public DbSet<AudioFile> LibraryAudioFiles { get; set; }
        public DbSet<MediaFile> LibraryMediaFiles { get; set; }
        // Audio entities
        public DbSet<AudioVerse.Domain.Entities.Audio.MusicGenre> MusicGenres { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Audio.DanceStyle> DanceStyles { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Audio.SongDanceMatch> SongDanceMatches { get; set; }
        // Notifications
        public DbSet<AudioVerse.Domain.Entities.Notification> Notifications { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Audio.Playlist> Playlists { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Audio.PlaylistItem> PlaylistItems { get; set; }
        
        // Radio / Broadcast entities
        public DbSet<AudioVerse.Domain.Entities.Radio.RadioStation> RadioStations { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Radio.BroadcastSession> BroadcastSessions { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Radio.RadioListener> RadioListeners { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Radio.RadioPlayStat> RadioPlayStats { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Radio.VoiceSession> VoiceSessions { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Radio.VoiceSegment> VoiceSegments { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Radio.RadioStationInvite> RadioStationInvites { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Radio.RadioScheduleSlot> RadioScheduleSlots { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Radio.RadioChatMessage> RadioChatMessages { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Radio.RadioSongReaction> RadioSongReactions { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Radio.RadioComment> RadioComments { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Radio.RadioFollow> RadioFollows { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Radio.ExternalRadioStation> ExternalRadioStations { get; set; }

        // Soundfonts
        public DbSet<AudioVerse.Domain.Entities.Audio.Soundfont> Soundfonts { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Audio.SoundfontFile> SoundfontFiles { get; set; }

        // ── External Accounts & Locations ──
        public DbSet<UserExternalAccount> UserExternalAccounts { get; set; }
        public DbSet<EventLocation> EventLocations { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Events.EventParticipant> EventParticipants { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Events.EventDateProposal> EventDateProposals { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Events.EventDateVote> EventDateVotes { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Events.EventSessionGamePick> EventSessionGamePicks { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Events.EventSessionGameVote> EventSessionGameVotes { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Events.EventSessionSongPick> EventSessionSongPicks { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Events.EventSessionSongSignup> EventSessionSongSignups { get; set; }

        public DbSet<UserProfileSettings> UserProfileSettings { get; set; }
        public DbSet<AbuseReport> AbuseReports { get; set; }

        // ── Contacts & Address Book ──
        public DbSet<Contact> Contacts { get; set; }
        public DbSet<ContactEmail> ContactEmails { get; set; }
        public DbSet<ContactPhone> ContactPhones { get; set; }
        public DbSet<ContactAddress> ContactAddresses { get; set; }
        public DbSet<ContactGroup> ContactGroups { get; set; }
        public DbSet<ContactGroupMember> ContactGroupMembers { get; set; }

        // ── Kampanie karaoke & Postęp ──
        public DbSet<AudioVerse.Domain.Entities.Karaoke.Campaigns.CampaignTemplate> CampaignTemplates { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Karaoke.Campaigns.CampaignTemplateRound> CampaignTemplateRounds { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Karaoke.Campaigns.CampaignTemplateRoundSong> CampaignTemplateRoundSongs { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Karaoke.Campaigns.Campaign> Campaigns { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Karaoke.Campaigns.CampaignPlayer> CampaignPlayers { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Karaoke.Campaigns.CampaignRoundProgress> CampaignRoundProgress { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Karaoke.Campaigns.SkillDefinition> SkillDefinitions { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Karaoke.Campaigns.PlayerSkill> PlayerSkills { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Karaoke.Campaigns.PlayerProgress> PlayerProgress { get; set; }
        public DbSet<AudioVerse.Domain.Entities.Karaoke.Campaigns.XpTransaction> XpTransactions { get; set; }

        // ── News / RSS Feeds ──
        public DbSet<AudioVerse.Domain.Entities.News.NewsFeedCategory> NewsFeedCategories { get; set; }
        public DbSet<AudioVerse.Domain.Entities.News.NewsFeed> NewsFeeds { get; set; }
        public DbSet<AudioVerse.Domain.Entities.News.NewsArticle> NewsArticles { get; set; }


        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // JSON value objects — stored as serialized text in UserProfilePlayer.KaraokeSettings
            modelBuilder.Ignore<AudioVerse.Domain.Entities.UserProfiles.KaraokeSettings>();
            modelBuilder.Ignore<AudioVerse.Domain.Entities.UserProfiles.KaraokeBarFill>();
            modelBuilder.Ignore<AudioVerse.Domain.Entities.UserProfiles.KaraokeFontSettings>();

            // Apply all IEntityTypeConfiguration from this assembly
            modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());

            // Global query filter: soft-deleted entities are excluded by default
            foreach (var entityType in modelBuilder.Model.GetEntityTypes())
            {
                if (typeof(AudioVerse.Domain.Entities.ISoftDeletable).IsAssignableFrom(entityType.ClrType))
                {
                    var param = System.Linq.Expressions.Expression.Parameter(entityType.ClrType, "e");
                    var prop = System.Linq.Expressions.Expression.Property(param, nameof(AudioVerse.Domain.Entities.ISoftDeletable.IsDeleted));
                    var filter = System.Linq.Expressions.Expression.Lambda(
                        System.Linq.Expressions.Expression.Not(prop), param);
                    modelBuilder.Entity(entityType.ClrType).HasQueryFilter(filter);
                }
            }

            // Identity keys
            modelBuilder.Entity<IdentityUserLogin<int>>().HasKey(iul => new { iul.LoginProvider, iul.ProviderKey });
            modelBuilder.Entity<IdentityUserRole<int>>().HasKey(iur => new { iur.UserId, iur.RoleId });
            modelBuilder.Entity<IdentityUserToken<int>>().HasKey(iut => new { iut.UserId, iut.LoginProvider, iut.Name });

            // UserProfile 1:1 Contact (self-entry card) — explicit FK, no inverse nav on Contact
            modelBuilder.Entity<AudioVerse.Domain.Entities.UserProfiles.UserProfile>()
                .HasOne(u => u.Contact)
                .WithOne()
                .HasForeignKey<AudioVerse.Domain.Entities.UserProfiles.UserProfile>(u => u.ContactId)
                .OnDelete(DeleteBehavior.SetNull);

            // Event.Organizer → UserProfile is configured in KaraokeEventConfiguration

            modelBuilder.UseOpenIddict();
        }
    }
}
