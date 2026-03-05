using AudioVerse.API.Areas.Admin.Hubs;
using AudioVerse.API.Areas.Karaoke.Hubs;
using AudioVerse.API.Middleware;
using AudioVerse.Application;
using AudioVerse.Application.Queries.Karaoke;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;
using AudioVerse.Infrastructure;
using AudioVerse.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using OpenTelemetry.Trace;
using Serilog;
using FluentValidation;
using FluentValidation.AspNetCore;
using StackExchange.Redis;
using AudioVerse.Application.Services.Audio;
using AudioVerse.Application.Services.Platforms;
using AudioVerse.Application.Services.Karaoke;
using AudioVerse.Application.Services.DMX;
using AudioVerse.Application.Services.Utils;
using AudioVerse.Application.Services.Platforms.Tidal;
using AudioVerse.Application.Services.Platforms.Spotify;
using AudioVerse.Application.Services.SongInformations;
using AudioVerse.Domain.Entities.UserProfiles;
using AudioVerse.API.Seed;

namespace AudioVerse.API
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);   
            Console.WriteLine("Starting AudioVerse.API");

            // QuestPDF Community License
            QuestPDF.Settings.License = QuestPDF.Infrastructure.LicenseType.Community;
            builder.Services.AddInfrastructure(builder.Configuration);
            builder.Services.AddApplication(builder.Configuration);

            // ?? Rejestracja CQRS + MediatR
            builder.Services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(GetAllSongsQuery).Assembly));

            // Global exception handling (RFC 7807 Problem Details)
            builder.Services.AddProblemDetails();
            builder.Services.AddExceptionHandler<AudioVerse.API.Middleware.GlobalExceptionHandler>();

            // Kontrolery i Swagger
            builder.Services.AddControllers()
                .AddJsonOptions(options =>
                {
                    // Avoid object cycle serialization errors when returning entities with navigation properties
                    options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
                    options.JsonSerializerOptions.MaxDepth = 64; // increase depth if needed
                });
            // Radio service
            builder.Services.AddScoped<AudioVerse.API.Services.Radio.IRadioService, AudioVerse.API.Services.Radio.RadioService>();
            // Event PDF export
            builder.Services.AddScoped<AudioVerse.API.Services.EventPdfExportService>();
            // Event notification service (subscriptions + reminders)
            builder.Services.AddScoped<AudioVerse.Application.Services.Events.IEventNotificationService, AudioVerse.Application.Services.Events.EventNotificationService>();
            // BGG catalog sync service (cache-through search, full sync, export/import)
            builder.Services.AddSingleton<AudioVerse.Application.Services.Games.IBggSyncService, AudioVerse.Application.Services.Games.BggSyncService>();
            // Google Books cache-through service (on-demand caching, export/import)
            builder.Services.AddSingleton<AudioVerse.Application.Services.Books.IBookCacheService, AudioVerse.Application.Services.Books.BookCacheService>();
            // Background broadcaster that pushes NowPlaying updates to SignalR groups
            builder.Services.AddHostedService<AudioVerse.API.Services.Radio.RadioBroadcastService>();
            // HLS transcoder background job (optional, requires ffmpeg on PATH and file storage configured)
            builder.Services.AddHostedService<AudioVerse.API.Services.Transcoding.HlsTranscoderService>();
            // Spotify integration: configure options and HTTP client + service
            builder.Services.Configure<AudioVerse.Application.Services.Platforms.Spotify.SpotifyServiceOptions>(builder.Configuration.GetSection("Spotify"));
            // Make SpotifyServiceOptions value available for direct injection
            builder.Services.AddSingleton(sp => sp.GetRequiredService<Microsoft.Extensions.Options.IOptions<AudioVerse.Application.Services.Platforms.Spotify.SpotifyServiceOptions>>().Value);
            builder.Services.AddHttpClient<AudioVerse.Application.Services.Platforms.Spotify.ISpotifyService, AudioVerse.Application.Services.Platforms.Spotify.SpotifyService>();
            // FluentValidation - register validators from application assembly
            builder.Services.AddFluentValidationAutoValidation();
            builder.Services.AddValidatorsFromAssembly(typeof(AudioVerse.Application.Handlers.User.CreateMicrophoneHandler).Assembly);

            // Output caching policies
            builder.Services.AddOutputCache(options =>
            {
                options.AddBasePolicy(b => b.NoCache());
                options.AddPolicy("CacheLong", b => b.Expire(TimeSpan.FromHours(1)));
                options.AddPolicy("CacheMedium", b => b.Expire(TimeSpan.FromMinutes(15)));
                options.AddPolicy("CacheShort", b => b.Expire(TimeSpan.FromSeconds(30)));
            });

            // Rate limiting
            builder.Services.AddRateLimiter(options =>
            {
                options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
                options.AddFixedWindowLimiter("AuthStrict", o =>
                {
                    o.PermitLimit = 10;
                    o.Window = TimeSpan.FromMinutes(1);
                    o.QueueLimit = 0;
                });
                options.AddFixedWindowLimiter("ApiDefault", o =>
                {
                    o.PermitLimit = 60;
                    o.Window = TimeSpan.FromMinutes(1);
                    o.QueueLimit = 5;
                });
                options.AddFixedWindowLimiter("PublicLoose", o =>
                {
                    o.PermitLimit = 120;
                    o.Window = TimeSpan.FromMinutes(1);
                    o.QueueLimit = 10;
                });
            });

            // SignalR configuration with connection limits
            builder.Services.AddSignalR(options =>
            {
                options.MaximumReceiveMessageSize = 102400; // 100 KB
                options.StreamBufferCapacity = 10;
                options.EnableDetailedErrors = true;
                options.KeepAliveInterval = TimeSpan.FromSeconds(15);
                options.ClientTimeoutInterval = TimeSpan.FromSeconds(30);
            });
            
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen(c =>
            {
                c.CustomSchemaIds(type => type.FullName?.Replace("+", "."));
                c.SwaggerDoc("all", new Microsoft.OpenApi.OpenApiInfo { Title = "AudioVerse — All Endpoints", Version = "v1" });
                c.SwaggerDoc("events", new Microsoft.OpenApi.OpenApiInfo { Title = "AudioVerse — Events", Version = "v1" });
                c.SwaggerDoc("karaoke", new Microsoft.OpenApi.OpenApiInfo { Title = "AudioVerse — Karaoke", Version = "v1" });
                c.SwaggerDoc("games", new Microsoft.OpenApi.OpenApiInfo { Title = "AudioVerse — Games", Version = "v1" });
                c.SwaggerDoc("media", new Microsoft.OpenApi.OpenApiInfo { Title = "AudioVerse — Media Catalog", Version = "v1" });
                c.SwaggerDoc("editor", new Microsoft.OpenApi.OpenApiInfo { Title = "AudioVerse — Editor & DMX", Version = "v1" });
                c.SwaggerDoc("admin", new Microsoft.OpenApi.OpenApiInfo { Title = "AudioVerse — Admin", Version = "v1" });
                c.SwaggerDoc("library", new Microsoft.OpenApi.OpenApiInfo { Title = "AudioVerse — Media Library", Version = "v1" });
                c.SwaggerDoc("auth", new Microsoft.OpenApi.OpenApiInfo { Title = "AudioVerse — Auth & User", Version = "v1" });
                c.SwaggerDoc("other", new Microsoft.OpenApi.OpenApiInfo { Title = "AudioVerse — Other", Version = "v1" });

                c.DocInclusionPredicate((docName, apiDesc) =>
                {
                    var path = apiDesc.RelativePath?.ToLowerInvariant() ?? "";
                    return docName switch
                    {
                        "all" => true,
                        "events" => path.StartsWith("api/events") || path.StartsWith("api/organizations") || path.StartsWith("api/leagues") || path.StartsWith("api/betting"),
                        "karaoke" => path.StartsWith("api/karaoke"),
                        "games" => path.StartsWith("api/games"),
                        "media" => path.StartsWith("api/media/"),
                        "editor" => path.StartsWith("api/editor") || path.StartsWith("api/audio-editor") || path.StartsWith("api/dmx"),
                        "admin" => path.StartsWith("api/admin"),
                        "library" => path.StartsWith("api/library") || path.StartsWith("api/genres") || path.StartsWith("api/playlists") || path.StartsWith("api/dance"),
                        "auth" => path.StartsWith("api/user") || path.StartsWith("api/auth") || path.StartsWith("api/license"),
                        "other" => !path.StartsWith("api/events") && !path.StartsWith("api/organizations") && !path.StartsWith("api/leagues") && !path.StartsWith("api/betting")
                                && !path.StartsWith("api/karaoke") && !path.StartsWith("api/games")
                                && !path.StartsWith("api/media/")
                                && !path.StartsWith("api/editor") && !path.StartsWith("api/audio-editor") && !path.StartsWith("api/dmx")
                                && !path.StartsWith("api/admin") && !path.StartsWith("api/library") && !path.StartsWith("api/genres")
                                && !path.StartsWith("api/playlists") && !path.StartsWith("api/dance")
                                && !path.StartsWith("api/user") && !path.StartsWith("api/auth") && !path.StartsWith("api/license"),
                        _ => true
                    };
                });

                var xmlFile = System.IO.Path.ChangeExtension(System.Reflection.Assembly.GetExecutingAssembly().Location, ".xml");
                if (System.IO.File.Exists(xmlFile)) c.IncludeXmlComments(xmlFile);
            });
            builder.Services.AddHttpContextAccessor();
            // Current user service for CQRS handlers
            builder.Services.AddScoped<AudioVerse.Application.Services.ICurrentUserService, AudioVerse.API.Services.HttpCurrentUserService>();
            // Email sender
            builder.Services.Configure<AudioVerse.Infrastructure.Email.SmtpOptions>(builder.Configuration.GetSection("Smtp"));
            builder.Services.AddTransient<AudioVerse.Infrastructure.Email.IEmailSender, AudioVerse.Infrastructure.Email.SmtpEmailSender>();
            // Notification system (RabbitMQ queue + SMS via SMSAPI.pl)
            builder.Services.Configure<AudioVerse.Infrastructure.Notifications.RabbitMqOptions>(builder.Configuration.GetSection("RabbitMq"));
            builder.Services.Configure<AudioVerse.Infrastructure.Notifications.SmsApiOptions>(builder.Configuration.GetSection("SmsApi"));
            builder.Services.AddHttpClient<AudioVerse.Infrastructure.Notifications.ISmsSender, AudioVerse.Infrastructure.Notifications.SmsApiSmsSender>();

            if (builder.Configuration.GetValue("RabbitMq:Enabled", true))
            {
                builder.Services.AddSingleton<AudioVerse.Infrastructure.Notifications.INotificationDispatcher, AudioVerse.Infrastructure.Notifications.RabbitMqNotificationDispatcher>();
                builder.Services.AddHostedService<AudioVerse.Infrastructure.Notifications.NotificationConsumerService>();
            }
            else
            {
                builder.Services.AddSingleton<AudioVerse.Infrastructure.Notifications.INotificationDispatcher, AudioVerse.Infrastructure.Notifications.NoOpNotificationDispatcher>();
            }
            // Realtime lobby store - prefer Redis if REDIS_CONNECTION is provided, otherwise InMemory
            var redisConn = builder.Configuration["REDIS_CONNECTION"] ?? Environment.GetEnvironmentVariable("REDIS_CONNECTION");
            if (!string.IsNullOrEmpty(redisConn))
            {
                // Build configuration options
                var config = StackExchange.Redis.ConfigurationOptions.Parse(redisConn);
                config.AbortOnConnectFail = false; // don't abort, allow retries
                config.ConnectRetry = 5;
                config.KeepAlive = 180;
                config.ClientName = "audioverse-lobby";

                // Retry loop with exponential backoff
                ConnectionMultiplexer mux = null!;
                var maxAttempts = 5;
                var delayMs = 500;
                for (int attempt = 1; attempt <= maxAttempts; attempt++)
                {
                    try
                    {
                        Log.Information("Attempting to connect to Redis (attempt {Attempt})", attempt);
                        mux = StackExchange.Redis.ConnectionMultiplexer.Connect(config);
                        if (mux != null && mux.IsConnected)
                        {
                            Log.Information("Connected to Redis");
                            break;
                        }
                    }
                    catch (Exception ex)
                    {
                        Log.Warning(ex, "Redis connection attempt {Attempt} failed", attempt);
                    }

                    if (attempt < maxAttempts)
                    {
                        Thread.Sleep(delayMs);
                        delayMs *= 2;
                    }
                }

                if (mux != null && mux.IsConnected)
                {
                    builder.Services.AddSingleton<StackExchange.Redis.IConnectionMultiplexer>(mux);
                    builder.Services.AddSingleton<AudioVerse.Infrastructure.Realtime.ILobbyStore, AudioVerse.Infrastructure.Realtime.RedisLobbyStore>();
                }
                else
                {
                    Log.Error("Could not connect to Redis after retries, falling back to InMemoryLobbyStore");
                    builder.Services.AddSingleton<AudioVerse.Infrastructure.Realtime.ILobbyStore, AudioVerse.Infrastructure.Realtime.InMemoryLobbyStore>();
                }
            }
            else
            {
                builder.Services.AddSingleton<AudioVerse.Infrastructure.Realtime.ILobbyStore, AudioVerse.Infrastructure.Realtime.InMemoryLobbyStore>();
            }
            
            // HttpClient configuration with connection limits
            builder.Services.AddHttpClient(Options.DefaultName, client =>
            {
                client.Timeout = TimeSpan.FromSeconds(30);
            })
            .ConfigurePrimaryHttpMessageHandler(() => new SocketsHttpHandler
            {
                PooledConnectionLifetime = TimeSpan.FromMinutes(2),
                PooledConnectionIdleTimeout = TimeSpan.FromMinutes(1),
                MaxConnectionsPerServer = 50
            });

            // Logging — Serilog (direct logger, no bootstrap/freeze for test-safety)
            Log.Logger = new LoggerConfiguration()
                .ReadFrom.Configuration(builder.Configuration)
                .WriteTo.Console()
                .Enrich.FromLogContext()
                .MinimumLevel.Override("Microsoft", Serilog.Events.LogEventLevel.Warning)
                .MinimumLevel.Information()
                .CreateLogger();

            builder.Services.AddSerilog(Log.Logger, dispose: false);
            Log.Information("Application starting...");


            //CORS
            var MyAllowSpecificOrigins = "CorsPolicy";
            builder.Services.AddCors(options =>
            {
                options.AddPolicy(name: MyAllowSpecificOrigins,
                    policy =>
                    {
                        policy.WithOrigins("https://audioverse.io", "http://localhost:5173", "http://localhost:5174")  // ?? Pozwól na polaczenia tylko z tej domeny
                          .AllowAnyMethod()                     // ?? Zezwalaj na dowolne metody (GET, POST, PUT, DELETE)
                          .AllowAnyHeader()
                          .AllowCredentials();
                    });
            });

            //Kestrel
            builder.WebHost.ConfigureKestrel(options =>
            {
                int httpPort = int.TryParse(Environment.GetEnvironmentVariable("Kestrel__HttpPort"), out var hPort) ? hPort : 5000;
                int httpsPort = int.TryParse(Environment.GetEnvironmentVariable("Kestrel__HttpsPort"), out var sPort) ? sPort : 5001;

                string certPath = Environment.GetEnvironmentVariable("Kestrel__Certificates__Default__Path") ?? "/certs/fullchain.pem";
                string keyPath = Environment.GetEnvironmentVariable("Kestrel__Certificates__Default__KeyPath") ?? "/certs/privkey.pem";

                // Connection and request limits
                options.Limits.MaxConcurrentConnections = 1000;
                options.Limits.MaxConcurrentUpgradedConnections = 1000;
                options.Limits.MaxRequestBodySize = 52428800; // 50 MB
                options.Limits.KeepAliveTimeout = TimeSpan.FromMinutes(2);
                options.Limits.RequestHeadersTimeout = TimeSpan.FromSeconds(30);
                
                options.AllowSynchronousIO = true;
                options.ListenAnyIP(httpPort); // HTTP

                /*options.ListenAnyIP(httpsPort, listenOptions =>
                {
                    try
                    {
                        var certificate = X509Certificate2.CreateFromPemFile(certPath, keyPath);
                        listenOptions.UseHttps(new HttpsConnectionAdapterOptions
                        {
                            ServerCertificate = certificate
                        });

                        Console.WriteLine($"??? Zaladowano certyfikat HTTPS: {certPath}");
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"??? Blad ladowania certyfikatu HTTPS: {ex.Message}");
                        throw;
                    }
                });*/ // HTTPS
            });


            // ??? Rejestracja Identity
            builder.Services.AddIdentity<UserProfile, IdentityRole<int>>(options =>
            {
                options.Password.RequireDigit = true;
                options.Password.RequiredLength = 8;
                options.Password.RequireUppercase = true;
                options.User.RequireUniqueEmail = true;
            })
                .AddEntityFrameworkStores<AudioVerseDbContext>()
                .AddDefaultTokenProviders();

            // ??? Rejestracja uslug Identity
            builder.Services.AddScoped<UserManager<UserProfile>>();
            builder.Services.AddScoped<RoleManager<IdentityRole<int>>>();

            // Health checks
            builder.Services.AddHealthChecks()
                .AddDbContextCheck<AudioVerseDbContext>("database")
                .AddCheck<AudioVerse.API.HealthChecks.RedisHealthCheck>("redis")
                .AddCheck<AudioVerse.API.HealthChecks.AiServicesHealthCheck>("ai-services");

            // Profanity filter
            builder.Services.AddSingleton<AudioVerse.Application.Services.IProfanityFilter, AudioVerse.Application.Services.ProfanityFilter>();

            // TOTP 2FA service
            builder.Services.AddSingleton<AudioVerse.Application.Services.User.ITotpService, AudioVerse.Application.Services.User.TotpService>();

            // MediaLibrary external service options
            builder.Services.Configure<SpotifyServiceOptions>(builder.Configuration.GetSection("Spotify"));
            builder.Services.AddSingleton(sp =>
            {
                var opts = new SpotifyServiceOptions();
                builder.Configuration.GetSection("Spotify").Bind(opts);
                return opts;
            });
            builder.Services.Configure<TidalServiceOptions>(builder.Configuration.GetSection("Tidal"));
            builder.Services.Configure<YouTubeServiceOptions>(builder.Configuration.GetSection("YouTube"));
            builder.Services.AddSingleton(sp =>
            {
                var opts = new YouTubeServiceOptions();
                builder.Configuration.GetSection("YouTube").Bind(opts);
                return opts;
            });
            builder.Services.AddHttpClient<ISpotifyService, SpotifyService>();
            builder.Services.AddHttpClient<IYouTubeSearchService, YouTubeSearchService>();
            builder.Services.AddHttpClient<AudioVerse.Application.Services.Platforms.IYouTubeService, AudioVerse.Application.Services.Platforms.YouTubeService>();
            builder.Services.AddHttpClient<ITidalService, TidalService>();

            // MediaLibrary AI + utility services
            builder.Services.Configure<AiAudioOptions>(builder.Configuration.GetSection("AiAudio"));
            builder.Services.Configure<AiVideoOptions>(builder.Configuration.GetSection("AiVideo"));
            builder.Services.Configure<AiMotionOptions>(builder.Configuration.GetSection("AiMotion"));
            builder.Services.Configure<AiServicesOptions>(builder.Configuration.GetSection("AiServices"));
            builder.Services.AddSingleton<AiCircuitBreaker>();
            builder.Services.AddSingleton<AiHealthMonitor>();
            builder.Services.AddHostedService(sp => sp.GetRequiredService<AiHealthMonitor>());
            builder.Services.Configure<AudioFilesOptions>(builder.Configuration.GetSection("AudioFiles"));
            builder.Services.AddHttpClient<IAiAudioService, AiAudioService>();
            builder.Services.AddHttpClient<IAiVideoService, AiVideoService>();
            builder.Services.AddHttpClient<IAiMotionService, AiMotionService>();
            builder.Services.AddScoped<AudioVerse.Application.Services.Laboratory.ILaboratoryService, AudioVerse.Application.Services.Laboratory.LaboratoryService>();
            builder.Services.AddHttpClient<ISongInformationService, SongInformationService>();
            builder.Services.AddSingleton<IAudioFilesService, AudioFilesService>();
            builder.Services.AddSingleton<IPlaylistService, PlaylistService>();
            builder.Services.Configure<AudioVerse.Application.Services.MediaLibrary.UltrastarFileOptions>(builder.Configuration.GetSection("Ultrastar"));
            builder.Services.AddSingleton<AudioVerse.Application.Services.MediaLibrary.IUltrastarFileService, UltrastarFileService>();
            builder.Services.AddHttpClient<ISongLicenseService, SongLicenseService>();
            builder.Services.AddHttpClient<AudioVerse.Application.Services.MediaLibrary.IDownloadService, AudioVerse.Application.Services.MediaLibrary.DownloadService>();
            builder.Services.AddSingleton<AudioVerse.Application.Services.MediaLibrary.IUltrastarConverterService, UltrastarConverterService>();

            // External integrations: BGG, Steam, Geocoding
            builder.Services.AddHttpClient<AudioVerse.Infrastructure.ExternalApis.Bgg.IBggClient, AudioVerse.Infrastructure.ExternalApis.Bgg.BggClient>();
            builder.Services.AddHttpClient<AudioVerse.Infrastructure.ExternalApis.Steam.ISteamClient, AudioVerse.Infrastructure.ExternalApis.Steam.SteamClient>();
            builder.Services.AddHttpClient<AudioVerse.Infrastructure.ExternalApis.IGeocodingService, AudioVerse.Infrastructure.ExternalApis.GeocodingService>();

            // Radio stream proxy (CORS-free audio streaming for NoteRiver FFT)
            builder.Services.AddHttpClient("RadioStream", client =>
            {
                client.Timeout = TimeSpan.FromHours(4);
                client.DefaultRequestHeaders.Add("User-Agent", "AudioVerse/1.0");
            });

            // Audit log real-time broadcaster (SignalR ? AdminHub)
            builder.Services.AddScoped<AudioVerse.Application.Services.User.IAuditLogBroadcaster, AudioVerse.API.Services.SignalRAuditLogBroadcaster>();

            // OpenTelemetry tracing (8.4)
            builder.Services.AddOpenTelemetry()
                .WithTracing(tracing =>
                {
                    tracing
                        .AddSource("AudioVerse.API")
                        .AddAspNetCoreInstrumentation()
                        .AddHttpClientInstrumentation();

                    if (builder.Environment.IsDevelopment())
                        tracing.AddConsoleExporter();
                });

            var app = builder.Build();

            // Ensure storage buckets exist (MinIO/S3)
            try
            {
                AudioVerse.Infrastructure.Storage.StorageInitializer.EnsureBucketsAsync(app.Services).GetAwaiter().GetResult();
            }
            catch (Exception ex)
            {
                Log.Warning(ex, "Failed to initialize storage buckets at startup");
            }

            //CORS
            app.UseCors(MyAllowSpecificOrigins);
            app.UseWebSockets();

            //Automigration (skip when running tests)
            var skipMigrations = app.Configuration.GetValue<bool>("SkipMigrations") || app.Environment.EnvironmentName == "Testing";
            if (!skipMigrations)
            {
                try
                {
                    using (var scope = app.Services.CreateScope())
                    {
                        var dbContext = scope.ServiceProvider.GetRequiredService<AudioVerseDbContext>();
                        dbContext.Database.Migrate();
                    }
                }
                catch (InvalidOperationException ex)
                {
                    // In test environments multiple EF providers might be registered temporarily.
                    // Log and continue - tests will initialize/seed their own test database.
                    Console.WriteLine($"Skipping migrations due to: {ex.Message}");
                }
            }

            async Task SeedDataAsync()
            {
                await IdentitySeeder.SeedAdminUser(app.Services);
                await SongSeeder.SeedSongsFromFolder(app.Services);
                await SoundfontSeeder.SeedSoundfontsFromFolder(app.Services);
                await AudioFileSeeder.SeedAudioFilesFromMusicFolder(app.Services);
                await WikiSeeder.SeedWikiPages(app.Services);
                await FrontendWikiSeeder.SeedFrontendWikiPages(app.Services);
                await RadioSeeder.SeedRadioBiba(app.Services);
                await NewsFeedSeeder.SeedNewsFeedsAsync(app.Services);
                await ExternalRadioSeeder.SeedExternalRadioStationsAsync(app.Services);
                await EventSeeder.SeedDefaultEventAsync(app.Services);
                await KaraokeScoringSeeder.SeedAsync(app.Services);
                // Seed genres and other infrastructure seeds
                try
                {
                    using var scope = app.Services.CreateScope();
                    var db = scope.ServiceProvider.GetRequiredService<AudioVerseDbContext>();
                    AudioVerse.Infrastructure.Seeds.SeedRunner.RunAll(db);
                }
                catch (Exception ex)
                {
                    Log.Warning(ex, "Failed to run seed runner");
                }
            }

            // Uruchamiamy seedowanie danych i czekamy na zakonczenie
            // Skip seeding when running tests or when SkipMigrations flag is set
            if (!skipMigrations)
            {
                try
                {
                    SeedDataAsync().GetAwaiter().GetResult();
                }
                catch (Exception ex)
                {
                    Log.Warning(ex, "Failed to seed data at startup — application will continue without seeded data");
                }
            }


            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI(c =>
                {
                    c.SwaggerEndpoint("/swagger/all/swagger.json", "? All Endpoints");
                    c.SwaggerEndpoint("/swagger/events/swagger.json", "Events");
                    c.SwaggerEndpoint("/swagger/karaoke/swagger.json", "Karaoke");
                    c.SwaggerEndpoint("/swagger/games/swagger.json", "Games");
                    c.SwaggerEndpoint("/swagger/media/swagger.json", "Media Catalog");
                    c.SwaggerEndpoint("/swagger/editor/swagger.json", "Editor & DMX");
                    c.SwaggerEndpoint("/swagger/admin/swagger.json", "Admin");
                    c.SwaggerEndpoint("/swagger/library/swagger.json", "Media Library");
                    c.SwaggerEndpoint("/swagger/auth/swagger.json", "Auth & User");
                    c.SwaggerEndpoint("/swagger/other/swagger.json", "Other");
                });
            }

            
            else
            {
                app.UseSwagger();
                app.UseSwaggerUI(c =>
                {
                    c.SwaggerEndpoint("/swagger/all/swagger.json", "? All Endpoints");
                    c.SwaggerEndpoint("/swagger/events/swagger.json", "Events");
                    c.SwaggerEndpoint("/swagger/karaoke/swagger.json", "Karaoke");
                    c.SwaggerEndpoint("/swagger/games/swagger.json", "Games");
                    c.SwaggerEndpoint("/swagger/media/swagger.json", "Media Catalog");
                    c.SwaggerEndpoint("/swagger/editor/swagger.json", "Editor & DMX");
                    c.SwaggerEndpoint("/swagger/admin/swagger.json", "Admin");
                    c.SwaggerEndpoint("/swagger/library/swagger.json", "Media Library");
                    c.SwaggerEndpoint("/swagger/auth/swagger.json", "Auth & User");
                    c.SwaggerEndpoint("/swagger/other/swagger.json", "Other");
                });
            }

            app.MapHub<AudioVerse.API.Hubs.RadioHub>("/hubs/radio");

            //Middleware
            app.UseMiddleware<JwtMiddleware>();
            app.UseSessionTimeout(); // Session timeout na 30 minut nieaktywnosci
            //app.UseMiddleware<ExceptionHandlingMiddleware>();

            //Logging
            app.UseMiddleware<CorrelationIdMiddleware>();
            app.UseMiddleware<AudioVerse.API.Middleware.ApiVersionMiddleware>();
            app.UseSerilogRequestLogging();

            app.UseExceptionHandler();
            app.UseAuthorization();
            app.UseOutputCache();
            app.UseRateLimiter();
            app.UseMiddleware<AudioVerse.API.Middleware.UserBanMiddleware>();
            app.UseMiddleware<AudioVerse.API.Middleware.ProfanityMiddleware>();
            app.MapControllers();
            app.MapHealthChecks("/health", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
            {
                ResponseWriter = async (context, report) =>
                {
                    context.Response.ContentType = "application/json";
                    var result = new
                    {
                        status = report.Status.ToString(),
                        duration = report.TotalDuration.TotalMilliseconds,
                        checks = report.Entries.Select(e => new
                        {
                            name = e.Key,
                            status = e.Value.Status.ToString(),
                            description = e.Value.Description,
                            duration = e.Value.Duration.TotalMilliseconds
                        })
                    };
                    await context.Response.WriteAsJsonAsync(result);
                }
            });
            app.MapHub<ModerationHub>("/hubs/moderation");
            app.MapHub<AdminHub>("/hubs/admin");
            app.MapHub<KaraokeHub>("/hubs/karaoke");
            app.MapHub<AudioVerse.API.Hubs.NotificationHub>("/hubs/notifications");
            app.MapHub<AudioVerse.API.Hubs.EditorHub>("/hubs/editor");
            app.MapHub<AudioVerse.API.Hubs.DeviceHub>("/hubs/devices");
            app.Run();

            Log.Information("Application started");
        }
    }
}
