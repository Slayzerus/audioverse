using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Sqlite;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using AudioVerse.Infrastructure.Persistence;
using AudioVerse.Domain.Repositories;
using AudioVerse.Infrastructure.Repositories;
using System.Data;
using Npgsql;
using AudioVerse.Infrastructure.Storage;
using AudioVerse.Infrastructure.Security;
using AudioVerse.Domain.Services;
using Microsoft.Extensions.Options;

namespace AudioVerse.Infrastructure
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
        {
            // Rejestracja DbContext dla EF Core
            var provider = configuration["Database:Provider"];
            if (!string.IsNullOrEmpty(provider) && provider.Equals("Sqlite", StringComparison.OrdinalIgnoreCase))
            {
                var sqliteConn = configuration.GetConnectionString("SqliteConnection") ?? configuration["ConnectionStrings:SqliteConnection"];
                services.AddDbContext<AudioVerseDbContext>(options =>
                    options.UseSqlite(sqliteConn)
                           .AddInterceptors(new Persistence.AuditSaveChangesInterceptor()));
            }
            else
            {
                services.AddDbContext<AudioVerseDbContext>(options =>
                    options.UseNpgsql(configuration.GetConnectionString("PostgresConnection"), b => b.MigrationsAssembly("AudioVerse.API"))
                           .AddInterceptors(new Persistence.AuditSaveChangesInterceptor()));
            }

            // Rejestracja Dapper i IDbConnection
            services.AddScoped<IDbConnection>(sp =>
            {
                var cfg = sp.GetRequiredService<IConfiguration>();
                var prov = cfg["Database:Provider"];
                if (!string.IsNullOrEmpty(prov) && prov.Equals("Sqlite", StringComparison.OrdinalIgnoreCase))
                {
                    var sqliteConn = cfg.GetConnectionString("SqliteConnection") ?? cfg["ConnectionStrings:SqliteConnection"];
                    return new Microsoft.Data.Sqlite.SqliteConnection(sqliteConn);
                }
                return new NpgsqlConnection(cfg.GetConnectionString("PostgresConnection"));
            });

            // FluentValidation registration moved to API project where application validators are available

            // Repository registrations
            // EF Core implementation — default IKaraokeRepository and explicit IEfKaraokeRepository
            services.AddScoped<KaraokeRepositoryEF>();
            services.AddScoped<IKaraokeRepository>(sp => sp.GetRequiredService<KaraokeRepositoryEF>());
            services.AddScoped<IEfKaraokeRepository>(sp => sp.GetRequiredService<KaraokeRepositoryEF>());
            services.AddScoped<IKaraokeSongPickRepository>(sp => sp.GetRequiredService<KaraokeRepositoryEF>());
            // Dapper implementation — explicit IDapperKaraokeRepository for read-heavy / performance-critical paths
            services.AddScoped<IDapperKaraokeRepository, KaraokeRepository>();
            services.AddScoped<IUserProfileRepository, UserProfileRepositoryEF>();
            services.AddScoped<IEditorRepository, EditorRepositoryEF>();
            services.AddScoped<IEventRepository, EventRepositoryEF>();
            services.AddScoped<IEventListRepository, EventListRepositoryEF>();
            services.AddScoped<IEventSubscriptionRepository, EventSubscriptionRepositoryEF>();

            // Security & Audit repositories
            services.AddScoped<IAuditRepository, AuditRepositoryEF>();
            services.AddScoped<IUserSecurityRepository, UserSecurityRepositoryEF>();
            // Token encryption for external account OAuth tokens
            services.Configure<TokenEncryptionOptions>(configuration.GetSection("TokenEncryption"));
            services.AddSingleton<ITokenEncryptionService, AesTokenEncryptionService>();

            // ExternalAccountRepository with transparent token encryption (decorator pattern)
            services.AddScoped<ExternalAccountRepositoryEF>();
            services.AddScoped<IExternalAccountRepository, EncryptedExternalAccountRepository>();
            
            // System & Location repositories
            services.AddScoped<ISystemConfigRepository, SystemConfigRepositoryEF>();
            services.AddScoped<ILocationRepository, LocationRepositoryEF>();
            
            // Moderation, Polls & Billing repositories
            services.AddScoped<IModerationRepository, ModerationRepositoryEF>();
            services.AddScoped<IPollRepository, PollRepositoryEF>();
            services.AddScoped<IBillingRepository, BillingRepositoryEF>();
            
            // DMX & Games repositories
            services.AddScoped<IDmxRepository, DmxRepositoryEF>();
            services.AddScoped<IGameRepository, GameRepositoryEF>();
            services.AddScoped<ISocialRepository, SocialRepositoryEF>();
            services.AddScoped<ISkinThemeRepository, SkinThemeRepositoryEF>();
            services.AddScoped<IPlaylistRepository, PlaylistRepositoryEF>();
            services.AddScoped<IMusicGenreRepository, MusicGenreRepositoryEF>();
            services.AddScoped<INotificationRepository, NotificationRepositoryEF>();
            services.AddScoped<IMediaCatalogRepository, MediaCatalogRepositoryEF>();
            services.AddScoped<ILeagueRepository, LeagueRepositoryEF>();
            services.AddScoped<IBettingRepository, BettingRepositoryEF>();
            services.AddScoped<AudioVerse.Domain.Services.ISongMatchingService, SongMatchingService>();
            services.AddScoped<AudioVerse.Domain.Services.IPlayerProgressService, PlayerProgressService>();
            services.AddScoped<AudioVerse.Domain.Services.ICampaignService, CampaignService>();

            // External API clients (BGG, Steam, IGDB, TMDB, OpenLibrary, GoogleBooks, TheSportsDB)
            services.AddHttpClient<ExternalApis.Bgg.IBggClient, ExternalApis.Bgg.BggClient>();
            services.AddHttpClient<ExternalApis.Steam.ISteamClient, ExternalApis.Steam.SteamClient>();
            services.AddHttpClient<ExternalApis.Igdb.IIgdbClient, ExternalApis.Igdb.IgdbClient>();
            services.AddHttpClient<ExternalApis.Tmdb.ITmdbClient, ExternalApis.Tmdb.TmdbClient>();
            services.AddHttpClient<ExternalApis.OpenLibrary.IOpenLibraryClient, ExternalApis.OpenLibrary.OpenLibraryClient>();
            services.AddHttpClient<ExternalApis.GoogleBooks.IGoogleBooksClient, ExternalApis.GoogleBooks.GoogleBooksClient>();
            services.AddHttpClient<ExternalApis.TheSportsDb.ITheSportsDbClient, ExternalApis.TheSportsDb.TheSportsDbClient>();
            services.AddHttpClient<ExternalApis.ISongMetadataClient, ExternalApis.SongMetadataClient>();

            // MinIO / S3 storage
            // Bind Minio options from both 'Minio' section and ConnectionStrings:Minio
            // Credentials cascade: Minio__AccessKey env > Minio:AccessKey config > MINIO_ROOT_USER env
            services.Configure<MinioOptions>(options =>
            {
                configuration.GetSection("Minio").Bind(options);
                var serviceUrl = configuration.GetConnectionString("Minio") ?? configuration["ConnectionStrings:Minio"];
                if (!string.IsNullOrEmpty(serviceUrl))
                {
                    // ensure scheme present for AmazonS3Config.ServiceURL (must be absolute)
                    if (!serviceUrl.StartsWith("http://", StringComparison.OrdinalIgnoreCase) && !serviceUrl.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
                    {
                        serviceUrl = "http://" + serviceUrl;
                    }
                    options.ServiceUrl = serviceUrl;
                }
                // Fallback: use MINIO_ROOT_USER / MINIO_ROOT_PASSWORD env vars if AccessKey/SecretKey not set
                // This allows docker-compose to share a single set of env vars between minio and api containers
                if (string.IsNullOrEmpty(options.AccessKey))
                    options.AccessKey = configuration["MINIO_ROOT_USER"];
                if (string.IsNullOrEmpty(options.SecretKey))
                    options.SecretKey = configuration["MINIO_ROOT_PASSWORD"];
                // allow overriding retry settings via environment variables
                var attempts = configuration["MINIO_BUCKET_RETRY_ATTEMPTS"];
                if (int.TryParse(attempts, out var a)) options.BucketCreationRetryAttempts = a;
                var delay = configuration["MINIO_BUCKET_RETRY_INITIAL_DELAY_MS"];
                if (int.TryParse(delay, out var d)) options.BucketCreationInitialDelayMs = d;
            });
            // Register S3FileStorage with ILoggerFactory resolved by DI
            // NOTE: register as singleton so background singleton services (presigned URL cache) can consume it
            services.AddSingleton<IFileStorage, S3FileStorage>();
            services.AddMemoryCache();
            services.AddSingleton<IPresignedUrlCache, PresignedUrlBackgroundCache>();
            services.AddHostedService(sp => (PresignedUrlBackgroundCache)sp.GetRequiredService<IPresignedUrlCache>());
            // upload metrics
            services.AddSingleton<Infrastructure.Telemetry.IUploadMetrics, Infrastructure.Telemetry.InMemoryUploadMetrics>();
            
            // Email (SMTP) - default to MailHog on localhost:1025 if not configured
            services.Configure<Email.SmtpOptions>(options =>
            {
                var host = configuration["Smtp:Host"] ?? configuration.GetConnectionString("Smtp") ?? "localhost";
                var port = int.TryParse(configuration["Smtp:Port"], out var p) ? p : 1025;
                var useSsl = bool.TryParse(configuration["Smtp:UseSsl"], out var s) ? s : false;
                options.Host = host;
                options.Port = port;
                options.UseSsl = useSsl;
                options.Username = configuration["Smtp:Username"];
                options.Password = configuration["Smtp:Password"];
                options.From = configuration["Smtp:From"] ?? "no-reply@audioverse.local";
            });
            services.AddTransient<Email.IEmailSender, Email.SmtpEmailSender>();
            // realtime metrics
            services.AddSingleton<Infrastructure.Telemetry.IRealtimeMetrics, Infrastructure.Telemetry.InMemoryRealtimeMetrics>();
            // Redis rate limiter (if Redis configured)
            var redisConn = configuration.GetConnectionString("Redis") ?? configuration["Redis:ConnectionString"];
            if (!string.IsNullOrEmpty(redisConn))
            {
                try
                {
                    var mux = StackExchange.Redis.ConnectionMultiplexer.Connect(redisConn);
                    services.AddSingleton(mux);
                    services.AddSingleton<Infrastructure.RateLimiting.IRateLimiter>(sp => new Infrastructure.RateLimiting.RedisRateLimiter(mux, int.TryParse(configuration["RateLimiting:UploadsPerMinute"], out var l) ? l : 10, TimeSpan.FromMinutes(1)));
                }
                catch (StackExchange.Redis.RedisConnectionException)
                {
                    services.AddSingleton<Infrastructure.RateLimiting.IRateLimiter, Infrastructure.RateLimiting.InMemoryRateLimiter>();
                }
            }
            else
            {
                // fallback to in-memory limiter simple implementation
                services.AddSingleton<Infrastructure.RateLimiting.IRateLimiter, Infrastructure.RateLimiting.InMemoryRateLimiter>();
            }

            // Background jobs
            services.AddHostedService<BackgroundJobs.CleanupBackgroundService>();
            services.AddHostedService<BackgroundJobs.EventReminderBackgroundService>();
            services.AddHostedService<BackgroundJobs.RssFetcherBackgroundService>();

            // News / RSS
            services.AddScoped<INewsFeedRepository, NewsFeedRepositoryEF>();

            // Vendor Marketplace
            services.AddScoped<IVendorRepository, VendorRepositoryEF>();

            // Wishlists & Gift Registries
            services.AddScoped<IWishlistRepository, WishlistRepositoryEF>();

            // Soundfonts
            services.AddScoped<ISoundfontRepository, SoundfontRepositoryEF>();

            // Media Library Songs
            services.AddScoped<ILibrarySongRepository, LibrarySongRepositoryEF>();

            // Media Library Albums & Artists
            services.AddScoped<ILibraryAlbumRepository, LibraryAlbumRepositoryEF>();
            services.AddScoped<ILibraryArtistRepository, LibraryArtistRepositoryEF>();

            // Contacts
            services.AddScoped<IContactRepository, ContactRepositoryEF>();

            // Wiki
            services.AddScoped<IWikiRepository, WikiRepositoryEF>();

            // Radio
            services.AddScoped<IRadioRepository, RadioRepositoryEF>();

            return services;
        }
    }
}
