using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace AudioVerse.API.Migrations
{
    /// <inheritdoc />
    public partial class init : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AbuseReports",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ReporterUserId = table.Column<int>(type: "integer", nullable: true),
                    ReporterUsername = table.Column<string>(type: "text", nullable: true),
                    TargetType = table.Column<string>(type: "text", nullable: false),
                    TargetValue = table.Column<string>(type: "text", nullable: false),
                    Reason = table.Column<string>(type: "text", nullable: false),
                    Comment = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Resolved = table.Column<bool>(type: "boolean", nullable: false),
                    ModeratorComment = table.Column<string>(type: "text", nullable: true),
                    ResolvedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AbuseReports", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AdminScoringPresets",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    DataJson = table.Column<string>(type: "text", nullable: false),
                    ModifiedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ModifiedByUserId = table.Column<int>(type: "integer", nullable: true),
                    ModifiedByUsername = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AdminScoringPresets", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AspNetRoles",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    NormalizedName = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    ConcurrencyStamp = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetRoles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUsers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    RefreshToken = table.Column<string>(type: "text", nullable: false),
                    RefreshTokenExpiryTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    FullName = table.Column<string>(type: "text", nullable: false),
                    IsBlocked = table.Column<bool>(type: "boolean", nullable: false),
                    RequirePasswordChange = table.Column<bool>(type: "boolean", nullable: false),
                    PasswordExpiryDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    PasswordValidityDays = table.Column<int>(type: "integer", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastPasswordChangeDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    TotpEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    TotpSecret = table.Column<string>(type: "text", nullable: true),
                    UserName = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    NormalizedUserName = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    Email = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    NormalizedEmail = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    EmailConfirmed = table.Column<bool>(type: "boolean", nullable: false),
                    PasswordHash = table.Column<string>(type: "text", nullable: true),
                    SecurityStamp = table.Column<string>(type: "text", nullable: true),
                    ConcurrencyStamp = table.Column<string>(type: "text", nullable: true),
                    PhoneNumber = table.Column<string>(type: "text", nullable: true),
                    PhoneNumberConfirmed = table.Column<bool>(type: "boolean", nullable: false),
                    TwoFactorEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    LockoutEnd = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LockoutEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    AccessFailedCount = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUsers", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AudioClips",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserProfileId = table.Column<int>(type: "integer", nullable: true),
                    FileName = table.Column<string>(type: "text", nullable: false),
                    FileFormat = table.Column<string>(type: "text", nullable: false),
                    ObjectKey = table.Column<string>(type: "text", nullable: true),
                    Duration = table.Column<TimeSpan>(type: "interval", nullable: false),
                    Size = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AudioClips", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AudioEffects",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Type = table.Column<int>(type: "integer", nullable: false),
                    ParametersJson = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AudioEffects", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AudioExportTasks",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ProjectId = table.Column<int>(type: "integer", nullable: false),
                    RequestedByUserId = table.Column<int>(type: "integer", nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    OutputObjectKey = table.Column<string>(type: "text", nullable: true),
                    ErrorMessage = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AudioExportTasks", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AudioInputPresets",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Version = table.Column<string>(type: "text", nullable: false),
                    UserProfileId = table.Column<int>(type: "integer", nullable: true),
                    Name = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AudioInputPresets", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AudioProjects",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    IsTemplate = table.Column<bool>(type: "boolean", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Volume = table.Column<int>(type: "integer", nullable: false),
                    UserProfileId = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AudioProjects", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AudioSamplePacks",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    Genre = table.Column<string>(type: "text", nullable: true),
                    Instrument = table.Column<string>(type: "text", nullable: true),
                    Bpm = table.Column<decimal>(type: "numeric", nullable: true),
                    CreatedByUserId = table.Column<int>(type: "integer", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AudioSamplePacks", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "BoardGameGenres",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    ParentGenreId = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BoardGameGenres", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BoardGameGenres_BoardGameGenres_ParentGenreId",
                        column: x => x.ParentGenreId,
                        principalTable: "BoardGameGenres",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "BookGenres",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BookGenres", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "CampaignTemplates",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    Difficulty = table.Column<int>(type: "integer", nullable: false),
                    IsPublic = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedByPlayerId = table.Column<int>(type: "integer", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ConfigJson = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CampaignTemplates", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "DanceStyles",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    NamePl = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Category = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    BpmMin = table.Column<int>(type: "integer", nullable: false),
                    BpmMax = table.Column<int>(type: "integer", nullable: false),
                    TimeSignature = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    EnergyMin = table.Column<decimal>(type: "numeric", nullable: true),
                    EnergyMax = table.Column<decimal>(type: "numeric", nullable: true),
                    ValenceMin = table.Column<decimal>(type: "numeric", nullable: true),
                    ValenceMax = table.Column<decimal>(type: "numeric", nullable: true),
                    RhythmPattern = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DanceStyles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "DmxScenes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    ChannelValuesJson = table.Column<string>(type: "text", nullable: false),
                    DurationMs = table.Column<int>(type: "integer", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DmxScenes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "DmxSceneSequences",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Loop = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DmxSceneSequences", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "EntityChangeLogs",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EntityName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    EntityId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Action = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    ChangedProperties = table.Column<string>(type: "text", nullable: true),
                    OldValues = table.Column<string>(type: "text", nullable: true),
                    NewValues = table.Column<string>(type: "text", nullable: true),
                    UserId = table.Column<int>(type: "integer", nullable: true),
                    Timestamp = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CorrelationId = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EntityChangeLogs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "EventAttractions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EventId = table.Column<int>(type: "integer", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    Type = table.Column<int>(type: "integer", nullable: false),
                    Location = table.Column<string>(type: "text", nullable: true),
                    Capacity = table.Column<int>(type: "integer", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    ImageKey = table.Column<string>(type: "text", nullable: true),
                    Price = table.Column<decimal>(type: "numeric", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EventAttractions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "EventExpenses",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EventId = table.Column<int>(type: "integer", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    Category = table.Column<int>(type: "integer", nullable: false),
                    Amount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    SplitMethod = table.Column<int>(type: "integer", nullable: false),
                    SourcePollId = table.Column<int>(type: "integer", nullable: true),
                    SourceMenuItemId = table.Column<int>(type: "integer", nullable: true),
                    SourceAttractionId = table.Column<int>(type: "integer", nullable: true),
                    PaidByUserId = table.Column<int>(type: "integer", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EventExpenses", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "EventInvites",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EventId = table.Column<int>(type: "integer", nullable: true),
                    FromUserId = table.Column<int>(type: "integer", nullable: true),
                    ToUserId = table.Column<int>(type: "integer", nullable: true),
                    ToEmail = table.Column<string>(type: "text", nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    Message = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    RespondedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EventInvites", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "EventLocations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    StreetAddress = table.Column<string>(type: "text", nullable: true),
                    City = table.Column<string>(type: "text", nullable: true),
                    State = table.Column<string>(type: "text", nullable: true),
                    PostalCode = table.Column<string>(type: "text", nullable: true),
                    Country = table.Column<string>(type: "text", nullable: true),
                    CountryCode = table.Column<string>(type: "text", nullable: true),
                    FormattedAddress = table.Column<string>(type: "text", nullable: true),
                    Latitude = table.Column<double>(type: "double precision", nullable: true),
                    Longitude = table.Column<double>(type: "double precision", nullable: true),
                    GooglePlaceId = table.Column<string>(type: "text", nullable: true),
                    OsmNodeId = table.Column<long>(type: "bigint", nullable: true),
                    OsmType = table.Column<string>(type: "text", nullable: true),
                    MapboxPlaceId = table.Column<string>(type: "text", nullable: true),
                    HerePlaceId = table.Column<string>(type: "text", nullable: true),
                    TimeZone = table.Column<string>(type: "text", nullable: true),
                    VirtualUrl = table.Column<string>(type: "text", nullable: true),
                    IsVirtual = table.Column<bool>(type: "boolean", nullable: false),
                    Phone = table.Column<string>(type: "text", nullable: true),
                    Website = table.Column<string>(type: "text", nullable: true),
                    Url = table.Column<string>(type: "text", nullable: true),
                    AccessInstructions = table.Column<string>(type: "text", nullable: true),
                    Capacity = table.Column<int>(type: "integer", nullable: true),
                    HasParking = table.Column<bool>(type: "boolean", nullable: false),
                    IsWheelchairAccessible = table.Column<bool>(type: "boolean", nullable: false),
                    HasPublicTransport = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EventLocations", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "EventMenuItems",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EventId = table.Column<int>(type: "integer", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    Category = table.Column<int>(type: "integer", nullable: false),
                    Price = table.Column<decimal>(type: "numeric", nullable: true),
                    IsAvailable = table.Column<bool>(type: "boolean", nullable: false),
                    ImageKey = table.Column<string>(type: "text", nullable: true),
                    Allergens = table.Column<string>(type: "text", nullable: true),
                    IsVegetarian = table.Column<bool>(type: "boolean", nullable: false),
                    IsVegan = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EventMenuItems", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "EventPayments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EventId = table.Column<int>(type: "integer", nullable: false),
                    UserId = table.Column<int>(type: "integer", nullable: true),
                    Email = table.Column<string>(type: "text", nullable: true),
                    PayerName = table.Column<string>(type: "text", nullable: true),
                    Amount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    Method = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    Reference = table.Column<string>(type: "text", nullable: true),
                    Note = table.Column<string>(type: "text", nullable: true),
                    PaidAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ConfirmedByUserId = table.Column<int>(type: "integer", nullable: true),
                    ConfirmedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EventPayments", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "EventPolls",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EventId = table.Column<int>(type: "integer", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    Type = table.Column<int>(type: "integer", nullable: false),
                    OptionSource = table.Column<int>(type: "integer", nullable: false),
                    Token = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedByUserId = table.Column<int>(type: "integer", nullable: true),
                    TrackCosts = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EventPolls", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "EventScheduleItems",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EventId = table.Column<int>(type: "integer", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    StartTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    EndTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Category = table.Column<int>(type: "integer", nullable: false),
                    Location = table.Column<string>(type: "text", nullable: true),
                    SortOrder = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EventScheduleItems", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "HoneyTokens",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TokenId = table.Column<string>(type: "text", nullable: false),
                    Type = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsTriggered = table.Column<bool>(type: "boolean", nullable: false),
                    TriggeredAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    TriggeredFrom = table.Column<string>(type: "text", nullable: true),
                    TriggeredDetails = table.Column<string>(type: "text", nullable: true),
                    NotificationUrl = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HoneyTokens", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "KaraokePlaylists",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KaraokePlaylists", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "KaraokeSongFileHistories",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    KaraokeSongFileId = table.Column<int>(type: "integer", nullable: false),
                    Version = table.Column<int>(type: "integer", nullable: false),
                    DataJson = table.Column<string>(type: "text", nullable: false),
                    ChangedByUserId = table.Column<int>(type: "integer", nullable: true),
                    Reason = table.Column<string>(type: "text", nullable: true),
                    ChangedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KaraokeSongFileHistories", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "LibraryAlbums",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Title = table.Column<string>(type: "text", nullable: false),
                    ReleaseYear = table.Column<int>(type: "integer", nullable: true),
                    MusicBrainzAlbumId = table.Column<string>(type: "text", nullable: true),
                    MusicBrainzReleaseGroupId = table.Column<string>(type: "text", nullable: true),
                    CoverUrl = table.Column<string>(type: "text", nullable: true),
                    PrimaryArtistId = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LibraryAlbums", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "LibraryArtists",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "text", nullable: false),
                    NormalizedName = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LibraryArtists", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "MovieGenres",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MovieGenres", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "MusicGenres",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    ParentGenreId = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MusicGenres", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MusicGenres_MusicGenres_ParentGenreId",
                        column: x => x.ParentGenreId,
                        principalTable: "MusicGenres",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Notifications",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Body = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    Type = table.Column<int>(type: "integer", nullable: false),
                    EntityId = table.Column<int>(type: "integer", nullable: true),
                    IsRead = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Notifications", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "OpenIddictApplications",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    ApplicationType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    ClientId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    ClientSecret = table.Column<string>(type: "text", nullable: true),
                    ClientType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    ConcurrencyToken = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    ConsentType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    DisplayName = table.Column<string>(type: "text", nullable: true),
                    DisplayNames = table.Column<string>(type: "text", nullable: true),
                    JsonWebKeySet = table.Column<string>(type: "text", nullable: true),
                    Permissions = table.Column<string>(type: "text", nullable: true),
                    PostLogoutRedirectUris = table.Column<string>(type: "text", nullable: true),
                    Properties = table.Column<string>(type: "text", nullable: true),
                    RedirectUris = table.Column<string>(type: "text", nullable: true),
                    Requirements = table.Column<string>(type: "text", nullable: true),
                    Settings = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OpenIddictApplications", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "OpenIddictScopes",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    ConcurrencyToken = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Description = table.Column<string>(type: "text", nullable: true),
                    Descriptions = table.Column<string>(type: "text", nullable: true),
                    DisplayName = table.Column<string>(type: "text", nullable: true),
                    DisplayNames = table.Column<string>(type: "text", nullable: true),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Properties = table.Column<string>(type: "text", nullable: true),
                    Resources = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OpenIddictScopes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Organizations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    LogoUrl = table.Column<string>(type: "text", nullable: true),
                    Website = table.Column<string>(type: "text", nullable: true),
                    OwnerId = table.Column<int>(type: "integer", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Organizations", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PasswordRequirements",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Description = table.Column<string>(type: "text", nullable: false),
                    Active = table.Column<bool>(type: "boolean", nullable: false),
                    MinLength = table.Column<int>(type: "integer", nullable: false),
                    MaxLength = table.Column<int>(type: "integer", nullable: false),
                    RequireUppercase = table.Column<bool>(type: "boolean", nullable: false),
                    RequireLowercase = table.Column<bool>(type: "boolean", nullable: false),
                    RequireDigit = table.Column<bool>(type: "boolean", nullable: false),
                    RequireSpecialChar = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PasswordRequirements", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Playlists",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    Access = table.Column<int>(type: "integer", nullable: false),
                    AccessCode = table.Column<string>(type: "text", nullable: true),
                    RequestMechanism = table.Column<int>(type: "integer", nullable: false),
                    Created = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<int>(type: "integer", nullable: true),
                    Modified = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ModifiedBy = table.Column<int>(type: "integer", nullable: true),
                    ParentId = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Playlists", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Playlists_Playlists_ParentId",
                        column: x => x.ParentId,
                        principalTable: "Playlists",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "SkillDefinitions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    IconUrl = table.Column<string>(type: "text", nullable: true),
                    Scope = table.Column<int>(type: "integer", nullable: false),
                    EffectKey = table.Column<string>(type: "text", nullable: false),
                    EffectValue = table.Column<string>(type: "text", nullable: true),
                    RequiredLevel = table.Column<int>(type: "integer", nullable: false),
                    RequiredCategory = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SkillDefinitions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SkinThemes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Emoji = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    IsDark = table.Column<bool>(type: "boolean", nullable: false),
                    BodyBackground = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Vars = table.Column<string>(type: "text", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    IsSystem = table.Column<bool>(type: "boolean", nullable: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SkinThemes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Soundfonts",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    Format = table.Column<int>(type: "integer", nullable: false),
                    Author = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Version = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    License = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    PresetCount = table.Column<int>(type: "integer", nullable: true),
                    TotalSizeBytes = table.Column<long>(type: "bigint", nullable: false),
                    Tags = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    UploadedByUserId = table.Column<int>(type: "integer", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Soundfonts", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SportGenres",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SportGenres", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SystemConfigurations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    SessionTimeoutMinutes = table.Column<int>(type: "integer", nullable: false),
                    CaptchaOption = table.Column<int>(type: "integer", nullable: false),
                    MaxMicrophonePlayers = table.Column<int>(type: "integer", nullable: false),
                    Active = table.Column<bool>(type: "boolean", nullable: false),
                    ModifiedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ModifiedByUserId = table.Column<int>(type: "integer", nullable: true),
                    ModifiedByUsername = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SystemConfigurations", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "TvShowGenres",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TvShowGenres", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "UserBans",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    Reason = table.Column<string>(type: "text", nullable: false),
                    BannedByAdminId = table.Column<int>(type: "integer", nullable: true),
                    BannedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserBans", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "VideoGameGenres",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    ParentGenreId = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VideoGameGenres", x => x.Id);
                    table.ForeignKey(
                        name: "FK_VideoGameGenres_VideoGameGenres_ParentGenreId",
                        column: x => x.ParentGenreId,
                        principalTable: "VideoGameGenres",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "VirtualWallets",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    LeagueId = table.Column<int>(type: "integer", nullable: true),
                    Balance = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    TotalWagered = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    TotalWon = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VirtualWallets", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "WikiPages",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Slug = table.Column<string>(type: "text", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false),
                    ContentMarkdown = table.Column<string>(type: "text", nullable: false),
                    Category = table.Column<string>(type: "text", nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    ParentId = table.Column<int>(type: "integer", nullable: true),
                    IsPublished = table.Column<bool>(type: "boolean", nullable: false),
                    Tags = table.Column<string>(type: "text", nullable: true),
                    Icon = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastEditedByUserId = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WikiPages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WikiPages_WikiPages_ParentId",
                        column: x => x.ParentId,
                        principalTable: "WikiPages",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "AspNetRoleClaims",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    RoleId = table.Column<int>(type: "integer", nullable: false),
                    ClaimType = table.Column<string>(type: "text", nullable: true),
                    ClaimValue = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetRoleClaims", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AspNetRoleClaims_AspNetRoles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "AspNetRoles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserClaims",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    ClaimType = table.Column<string>(type: "text", nullable: true),
                    ClaimValue = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserClaims", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AspNetUserClaims_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserLogins",
                columns: table => new
                {
                    LoginProvider = table.Column<string>(type: "text", nullable: false),
                    ProviderKey = table.Column<string>(type: "text", nullable: false),
                    ProviderDisplayName = table.Column<string>(type: "text", nullable: true),
                    UserId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserLogins", x => new { x.LoginProvider, x.ProviderKey });
                    table.ForeignKey(
                        name: "FK_AspNetUserLogins_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserRoles",
                columns: table => new
                {
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    RoleId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserRoles", x => new { x.UserId, x.RoleId });
                    table.ForeignKey(
                        name: "FK_AspNetUserRoles_AspNetRoles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "AspNetRoles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AspNetUserRoles_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserTokens",
                columns: table => new
                {
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    LoginProvider = table.Column<string>(type: "text", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Value = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserTokens", x => new { x.UserId, x.LoginProvider, x.Name });
                    table.ForeignKey(
                        name: "FK_AspNetUserTokens_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AuditLogs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<int>(type: "integer", nullable: true),
                    Username = table.Column<string>(type: "text", nullable: false),
                    Action = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: false),
                    DetailsJson = table.Column<string>(type: "text", nullable: true),
                    Success = table.Column<bool>(type: "boolean", nullable: false),
                    ErrorMessage = table.Column<string>(type: "text", nullable: true),
                    Timestamp = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IpAddress = table.Column<string>(type: "text", nullable: true),
                    UserAgent = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AuditLogs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AuditLogs_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "BoardGameCollections",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    OwnerId = table.Column<int>(type: "integer", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    IsPublic = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ParentId = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BoardGameCollections", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BoardGameCollections_AspNetUsers_OwnerId",
                        column: x => x.OwnerId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_BoardGameCollections_BoardGameCollections_ParentId",
                        column: x => x.ParentId,
                        principalTable: "BoardGameCollections",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "BookCollections",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    OwnerId = table.Column<int>(type: "integer", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    IsPublic = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ParentId = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BookCollections", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BookCollections_AspNetUsers_OwnerId",
                        column: x => x.OwnerId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_BookCollections_BookCollections_ParentId",
                        column: x => x.ParentId,
                        principalTable: "BookCollections",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Captchas",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Challenge = table.Column<string>(type: "text", nullable: false),
                    Answer = table.Column<string>(type: "text", nullable: false),
                    CaptchaType = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsUsed = table.Column<bool>(type: "boolean", nullable: false),
                    UserId = table.Column<int>(type: "integer", nullable: true),
                    IpAddress = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Captchas", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Captchas_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "LoginAttempts",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    Username = table.Column<string>(type: "text", nullable: false),
                    Success = table.Column<bool>(type: "boolean", nullable: false),
                    AttemptTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IpAddress = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LoginAttempts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LoginAttempts_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MicrophoneAssignments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    MicrophoneId = table.Column<string>(type: "text", nullable: false),
                    Color = table.Column<string>(type: "text", nullable: false),
                    Slot = table.Column<int>(type: "integer", nullable: false),
                    AssignedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MicrophoneAssignments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MicrophoneAssignments_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MovieCollections",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    OwnerId = table.Column<int>(type: "integer", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    IsPublic = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ParentId = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MovieCollections", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MovieCollections_AspNetUsers_OwnerId",
                        column: x => x.OwnerId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MovieCollections_MovieCollections_ParentId",
                        column: x => x.ParentId,
                        principalTable: "MovieCollections",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "OneTimePasswords",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    PasswordHash = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsUsed = table.Column<bool>(type: "boolean", nullable: false),
                    UsedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OneTimePasswords", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OneTimePasswords_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PasswordHistory",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserProfileId = table.Column<int>(type: "integer", nullable: false),
                    PasswordHash = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PasswordHistory", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PasswordHistory_AspNetUsers_UserProfileId",
                        column: x => x.UserProfileId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TvShowCollections",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    OwnerId = table.Column<int>(type: "integer", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    IsPublic = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ParentId = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TvShowCollections", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TvShowCollections_AspNetUsers_OwnerId",
                        column: x => x.OwnerId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TvShowCollections_TvShowCollections_ParentId",
                        column: x => x.ParentId,
                        principalTable: "TvShowCollections",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "UserDevices",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    DeviceId = table.Column<string>(type: "text", nullable: false),
                    DeviceName = table.Column<string>(type: "text", nullable: false),
                    UserDeviceName = table.Column<string>(type: "text", nullable: false),
                    DeviceType = table.Column<int>(type: "integer", nullable: false),
                    Visible = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserDevices", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserDevices_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserExternalAccounts",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserProfileId = table.Column<int>(type: "integer", nullable: false),
                    Platform = table.Column<int>(type: "integer", nullable: false),
                    ExternalUserId = table.Column<string>(type: "text", nullable: false),
                    DisplayName = table.Column<string>(type: "text", nullable: true),
                    Email = table.Column<string>(type: "text", nullable: true),
                    AvatarUrl = table.Column<string>(type: "text", nullable: true),
                    AccessToken = table.Column<string>(type: "text", nullable: true),
                    RefreshToken = table.Column<string>(type: "text", nullable: true),
                    TokenExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Scopes = table.Column<string>(type: "text", nullable: true),
                    LinkedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastUsedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    Metadata = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserExternalAccounts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserExternalAccounts_AspNetUsers_UserProfileId",
                        column: x => x.UserProfileId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserMicrophones",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    DeviceId = table.Column<string>(type: "text", nullable: false),
                    Volume = table.Column<int>(type: "integer", nullable: false),
                    Threshold = table.Column<int>(type: "integer", nullable: false),
                    Visible = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    MicGain = table.Column<int>(type: "integer", nullable: false),
                    MonitorEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    MonitorVolume = table.Column<int>(type: "integer", nullable: false),
                    PitchThreshold = table.Column<double>(type: "double precision", nullable: false),
                    SmoothingWindow = table.Column<int>(type: "integer", nullable: false),
                    HysteresisFrames = table.Column<int>(type: "integer", nullable: false),
                    RmsThreshold = table.Column<double>(type: "double precision", nullable: false),
                    UseHanning = table.Column<bool>(type: "boolean", nullable: false),
                    PitchDetectionMethod = table.Column<int>(type: "integer", nullable: false),
                    OffsetMs = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserMicrophones", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserMicrophones_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserProfilePlayers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "text", nullable: false),
                    ProfileId = table.Column<int>(type: "integer", nullable: false),
                    PreferredColors = table.Column<string>(type: "text", nullable: false),
                    FillPattern = table.Column<string>(type: "text", nullable: false),
                    IsPrimary = table.Column<bool>(type: "boolean", nullable: false),
                    KaraokeSettings = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserProfilePlayers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserProfilePlayers_AspNetUsers_ProfileId",
                        column: x => x.ProfileId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserProfileSettings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    DeveloperMode = table.Column<bool>(type: "boolean", nullable: false),
                    Jurors = table.Column<bool>(type: "boolean", nullable: false),
                    Fullscreen = table.Column<bool>(type: "boolean", nullable: false),
                    Theme = table.Column<string>(type: "text", nullable: false),
                    SoundEffects = table.Column<bool>(type: "boolean", nullable: false),
                    Language = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserProfileSettings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserProfileSettings_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "VideoGameCollections",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    OwnerId = table.Column<int>(type: "integer", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    IsPublic = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ParentId = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VideoGameCollections", x => x.Id);
                    table.ForeignKey(
                        name: "FK_VideoGameCollections_AspNetUsers_OwnerId",
                        column: x => x.OwnerId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_VideoGameCollections_VideoGameCollections_ParentId",
                        column: x => x.ParentId,
                        principalTable: "VideoGameCollections",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "AudioClipTags",
                columns: table => new
                {
                    AudioClipId = table.Column<int>(type: "integer", nullable: false),
                    Tag = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AudioClipTags", x => new { x.AudioClipId, x.Tag });
                    table.ForeignKey(
                        name: "FK_AudioClipTags_AudioClips_AudioClipId",
                        column: x => x.AudioClipId,
                        principalTable: "AudioClips",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AudioProjectCollaborators",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ProjectId = table.Column<int>(type: "integer", nullable: false),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    Permission = table.Column<int>(type: "integer", nullable: false),
                    JoinedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AudioProjectCollaborators", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AudioProjectCollaborators_AudioProjects_ProjectId",
                        column: x => x.ProjectId,
                        principalTable: "AudioProjects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AudioSections",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ProjectId = table.Column<int>(type: "integer", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Duration = table.Column<TimeSpan>(type: "interval", nullable: false),
                    BPM = table.Column<decimal>(type: "numeric", nullable: false),
                    OrderNumber = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AudioSections", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AudioSections_AudioProjects_ProjectId",
                        column: x => x.ProjectId,
                        principalTable: "AudioProjects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AudioSamples",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    PackId = table.Column<int>(type: "integer", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    ObjectKey = table.Column<string>(type: "text", nullable: false),
                    MimeType = table.Column<string>(type: "text", nullable: true),
                    DurationMs = table.Column<int>(type: "integer", nullable: true),
                    Bpm = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: true),
                    Key = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AudioSamples", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AudioSamples_AudioSamplePacks_PackId",
                        column: x => x.PackId,
                        principalTable: "AudioSamplePacks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "BoardGames",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    MinPlayers = table.Column<int>(type: "integer", nullable: false),
                    MaxPlayers = table.Column<int>(type: "integer", nullable: false),
                    EstimatedDurationMinutes = table.Column<int>(type: "integer", nullable: true),
                    Genre = table.Column<string>(type: "text", nullable: true),
                    ImageKey = table.Column<string>(type: "text", nullable: true),
                    OwnerId = table.Column<int>(type: "integer", nullable: true),
                    BggId = table.Column<int>(type: "integer", nullable: true),
                    BggImageUrl = table.Column<string>(type: "text", nullable: true),
                    BggRating = table.Column<double>(type: "double precision", nullable: true),
                    BggYearPublished = table.Column<int>(type: "integer", nullable: true),
                    BoardGameGenreId = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BoardGames", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BoardGames_AspNetUsers_OwnerId",
                        column: x => x.OwnerId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_BoardGames_BoardGameGenres_BoardGameGenreId",
                        column: x => x.BoardGameGenreId,
                        principalTable: "BoardGameGenres",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "Books",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Title = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Author = table.Column<string>(type: "text", nullable: true),
                    Description = table.Column<string>(type: "text", nullable: true),
                    Isbn = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    PageCount = table.Column<int>(type: "integer", nullable: true),
                    PublishedYear = table.Column<int>(type: "integer", nullable: true),
                    Publisher = table.Column<string>(type: "text", nullable: true),
                    CoverUrl = table.Column<string>(type: "text", nullable: true),
                    Genre = table.Column<string>(type: "text", nullable: true),
                    Rating = table.Column<double>(type: "double precision", nullable: true),
                    Language = table.Column<string>(type: "text", nullable: true),
                    OwnerId = table.Column<int>(type: "integer", nullable: true),
                    OpenLibraryId = table.Column<string>(type: "text", nullable: true),
                    GoogleBooksId = table.Column<string>(type: "text", nullable: true),
                    ImportedFrom = table.Column<string>(type: "text", nullable: true),
                    BookGenreId = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Books", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Books_AspNetUsers_OwnerId",
                        column: x => x.OwnerId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Books_BookGenres_BookGenreId",
                        column: x => x.BookGenreId,
                        principalTable: "BookGenres",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "Campaigns",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TemplateId = table.Column<int>(type: "integer", nullable: false),
                    CoopMode = table.Column<int>(type: "integer", nullable: false),
                    StartedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CurrentRound = table.Column<int>(type: "integer", nullable: false),
                    TotalScore = table.Column<int>(type: "integer", nullable: false),
                    TotalXpEarned = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Campaigns", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Campaigns_CampaignTemplates_TemplateId",
                        column: x => x.TemplateId,
                        principalTable: "CampaignTemplates",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "DmxSceneSteps",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    SequenceId = table.Column<int>(type: "integer", nullable: false),
                    SceneId = table.Column<int>(type: "integer", nullable: false),
                    Order = table.Column<int>(type: "integer", nullable: false),
                    HoldMs = table.Column<int>(type: "integer", nullable: false),
                    FadeMs = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DmxSceneSteps", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DmxSceneSteps_DmxSceneSequences_SequenceId",
                        column: x => x.SequenceId,
                        principalTable: "DmxSceneSequences",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DmxSceneSteps_DmxScenes_SceneId",
                        column: x => x.SceneId,
                        principalTable: "DmxScenes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "EventExpenseShares",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ExpenseId = table.Column<int>(type: "integer", nullable: false),
                    UserId = table.Column<int>(type: "integer", nullable: true),
                    Email = table.Column<string>(type: "text", nullable: true),
                    ShareAmount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    Quantity = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EventExpenseShares", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EventExpenseShares_EventExpenses_ExpenseId",
                        column: x => x.ExpenseId,
                        principalTable: "EventExpenses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "EventPollOptions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    PollId = table.Column<int>(type: "integer", nullable: false),
                    Text = table.Column<string>(type: "text", nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    SourceEntityId = table.Column<int>(type: "integer", nullable: true),
                    SourceEntityType = table.Column<int>(type: "integer", nullable: true),
                    UnitCost = table.Column<decimal>(type: "numeric", nullable: true),
                    ImageUrl = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EventPollOptions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EventPollOptions_EventPolls_PollId",
                        column: x => x.PollId,
                        principalTable: "EventPolls",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "LibraryAlbumArtists",
                columns: table => new
                {
                    AlbumId = table.Column<int>(type: "integer", nullable: false),
                    ArtistId = table.Column<int>(type: "integer", nullable: false),
                    Role = table.Column<int>(type: "integer", nullable: false),
                    Order = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LibraryAlbumArtists", x => new { x.AlbumId, x.ArtistId });
                    table.ForeignKey(
                        name: "FK_LibraryAlbumArtists_LibraryAlbums_AlbumId",
                        column: x => x.AlbumId,
                        principalTable: "LibraryAlbums",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_LibraryAlbumArtists_LibraryArtists_ArtistId",
                        column: x => x.ArtistId,
                        principalTable: "LibraryArtists",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "LibraryArtistDetails",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ArtistId = table.Column<int>(type: "integer", nullable: false),
                    Bio = table.Column<string>(type: "text", nullable: true),
                    ImageUrl = table.Column<string>(type: "text", nullable: true),
                    Country = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LibraryArtistDetails", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LibraryArtistDetails_LibraryArtists_ArtistId",
                        column: x => x.ArtistId,
                        principalTable: "LibraryArtists",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "LibraryArtistFacts",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ArtistId = table.Column<int>(type: "integer", nullable: false),
                    Type = table.Column<int>(type: "integer", nullable: false),
                    Value = table.Column<string>(type: "text", nullable: true),
                    DateValue = table.Column<DateOnly>(type: "date", nullable: true),
                    IntValue = table.Column<int>(type: "integer", nullable: true),
                    Source = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LibraryArtistFacts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LibraryArtistFacts_LibraryArtists_ArtistId",
                        column: x => x.ArtistId,
                        principalTable: "LibraryArtists",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "LibrarySongs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Title = table.Column<string>(type: "text", nullable: false),
                    AlbumId = table.Column<int>(type: "integer", nullable: true),
                    ISRC = table.Column<string>(type: "text", nullable: true),
                    PrimaryArtistId = table.Column<int>(type: "integer", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DeletedByUserId = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LibrarySongs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LibrarySongs_LibraryAlbums_AlbumId",
                        column: x => x.AlbumId,
                        principalTable: "LibraryAlbums",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_LibrarySongs_LibraryArtists_PrimaryArtistId",
                        column: x => x.PrimaryArtistId,
                        principalTable: "LibraryArtists",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "Movies",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Title = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    OriginalTitle = table.Column<string>(type: "text", nullable: true),
                    Description = table.Column<string>(type: "text", nullable: true),
                    RuntimeMinutes = table.Column<int>(type: "integer", nullable: true),
                    ReleaseYear = table.Column<int>(type: "integer", nullable: true),
                    Director = table.Column<string>(type: "text", nullable: true),
                    PosterUrl = table.Column<string>(type: "text", nullable: true),
                    Genre = table.Column<string>(type: "text", nullable: true),
                    Rating = table.Column<double>(type: "double precision", nullable: true),
                    Language = table.Column<string>(type: "text", nullable: true),
                    OwnerId = table.Column<int>(type: "integer", nullable: true),
                    TmdbId = table.Column<int>(type: "integer", nullable: true),
                    ImdbId = table.Column<string>(type: "text", nullable: true),
                    ImportedFrom = table.Column<string>(type: "text", nullable: true),
                    MovieGenreId = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Movies", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Movies_AspNetUsers_OwnerId",
                        column: x => x.OwnerId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Movies_MovieGenres_MovieGenreId",
                        column: x => x.MovieGenreId,
                        principalTable: "MovieGenres",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "OpenIddictAuthorizations",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    ApplicationId = table.Column<string>(type: "text", nullable: true),
                    ConcurrencyToken = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    CreationDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Properties = table.Column<string>(type: "text", nullable: true),
                    Scopes = table.Column<string>(type: "text", nullable: true),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Subject = table.Column<string>(type: "character varying(400)", maxLength: 400, nullable: true),
                    Type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OpenIddictAuthorizations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OpenIddictAuthorizations_OpenIddictApplications_Application~",
                        column: x => x.ApplicationId,
                        principalTable: "OpenIddictApplications",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "ContactGroups",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    OwnerUserId = table.Column<int>(type: "integer", nullable: false),
                    OrganizationId = table.Column<int>(type: "integer", nullable: true),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    Color = table.Column<string>(type: "text", nullable: true),
                    Icon = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ContactGroups", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ContactGroups_AspNetUsers_OwnerUserId",
                        column: x => x.OwnerUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ContactGroups_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "Contacts",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    OwnerUserId = table.Column<int>(type: "integer", nullable: false),
                    LinkedUserId = table.Column<int>(type: "integer", nullable: true),
                    OrganizationId = table.Column<int>(type: "integer", nullable: true),
                    IsOrganization = table.Column<bool>(type: "boolean", nullable: false),
                    FirstName = table.Column<string>(type: "text", nullable: false),
                    LastName = table.Column<string>(type: "text", nullable: false),
                    DisplayName = table.Column<string>(type: "text", nullable: false),
                    Nickname = table.Column<string>(type: "text", nullable: true),
                    Company = table.Column<string>(type: "text", nullable: true),
                    JobTitle = table.Column<string>(type: "text", nullable: true),
                    Notes = table.Column<string>(type: "text", nullable: true),
                    AvatarUrl = table.Column<string>(type: "text", nullable: true),
                    ImportSource = table.Column<int>(type: "integer", nullable: false),
                    ExternalId = table.Column<string>(type: "text", nullable: true),
                    IsFavorite = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Contacts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Contacts_AspNetUsers_LinkedUserId",
                        column: x => x.LinkedUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Contacts_AspNetUsers_OwnerUserId",
                        column: x => x.OwnerUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Contacts_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "Leagues",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    Type = table.Column<int>(type: "integer", nullable: false),
                    OrganizationId = table.Column<int>(type: "integer", nullable: true),
                    LogoUrl = table.Column<string>(type: "text", nullable: true),
                    StartDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    EndDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    MaxParticipants = table.Column<int>(type: "integer", nullable: true),
                    OwnerId = table.Column<int>(type: "integer", nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Leagues", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Leagues_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "PlaylistLinks",
                columns: table => new
                {
                    SourcePlaylistId = table.Column<int>(type: "integer", nullable: false),
                    TargetPlaylistId = table.Column<int>(type: "integer", nullable: false),
                    OrderNumberStart = table.Column<int>(type: "integer", nullable: false),
                    OrderNumberTake = table.Column<int>(type: "integer", nullable: false),
                    OrderNumber = table.Column<int>(type: "integer", nullable: false),
                    RandomizeOrder = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PlaylistLinks", x => new { x.SourcePlaylistId, x.TargetPlaylistId });
                    table.ForeignKey(
                        name: "FK_PlaylistLinks_Playlists_SourcePlaylistId",
                        column: x => x.SourcePlaylistId,
                        principalTable: "Playlists",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PlaylistLinks_Playlists_TargetPlaylistId",
                        column: x => x.TargetPlaylistId,
                        principalTable: "Playlists",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "CampaignTemplateRounds",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TemplateId = table.Column<int>(type: "integer", nullable: false),
                    RoundNumber = table.Column<int>(type: "integer", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: true),
                    ScoreThreshold = table.Column<int>(type: "integer", nullable: false),
                    SingingMode = table.Column<int>(type: "integer", nullable: false),
                    SongsToChoose = table.Column<int>(type: "integer", nullable: false),
                    TimeLimitSeconds = table.Column<int>(type: "integer", nullable: true),
                    RewardSkillDefinitionId = table.Column<int>(type: "integer", nullable: true),
                    XpReward = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CampaignTemplateRounds", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CampaignTemplateRounds_CampaignTemplates_TemplateId",
                        column: x => x.TemplateId,
                        principalTable: "CampaignTemplates",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CampaignTemplateRounds_SkillDefinitions_RewardSkillDefiniti~",
                        column: x => x.RewardSkillDefinitionId,
                        principalTable: "SkillDefinitions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "SoundfontFiles",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    SoundfontId = table.Column<int>(type: "integer", nullable: false),
                    FileName = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    StorageKey = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    ContentType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    SizeBytes = table.Column<long>(type: "bigint", nullable: false),
                    FileType = table.Column<int>(type: "integer", nullable: false),
                    Sha256 = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    UploadedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SoundfontFiles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SoundfontFiles_Soundfonts_SoundfontId",
                        column: x => x.SoundfontId,
                        principalTable: "Soundfonts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SportActivities",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    Category = table.Column<string>(type: "text", nullable: true),
                    IsTeamSport = table.Column<bool>(type: "boolean", nullable: false),
                    IsIndoor = table.Column<bool>(type: "boolean", nullable: false),
                    IsOutdoor = table.Column<bool>(type: "boolean", nullable: false),
                    MinPlayers = table.Column<int>(type: "integer", nullable: true),
                    MaxPlayers = table.Column<int>(type: "integer", nullable: true),
                    IconUrl = table.Column<string>(type: "text", nullable: true),
                    Equipment = table.Column<string>(type: "text", nullable: true),
                    OwnerId = table.Column<int>(type: "integer", nullable: true),
                    WikidataId = table.Column<int>(type: "integer", nullable: true),
                    ImportedFrom = table.Column<string>(type: "text", nullable: true),
                    SportGenreId = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SportActivities", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SportActivities_AspNetUsers_OwnerId",
                        column: x => x.OwnerId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_SportActivities_SportGenres_SportGenreId",
                        column: x => x.SportGenreId,
                        principalTable: "SportGenres",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "TvShows",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Title = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    OriginalTitle = table.Column<string>(type: "text", nullable: true),
                    Description = table.Column<string>(type: "text", nullable: true),
                    FirstAirYear = table.Column<int>(type: "integer", nullable: true),
                    LastAirYear = table.Column<int>(type: "integer", nullable: true),
                    SeasonCount = table.Column<int>(type: "integer", nullable: true),
                    EpisodeCount = table.Column<int>(type: "integer", nullable: true),
                    Network = table.Column<string>(type: "text", nullable: true),
                    PosterUrl = table.Column<string>(type: "text", nullable: true),
                    Genre = table.Column<string>(type: "text", nullable: true),
                    Rating = table.Column<double>(type: "double precision", nullable: true),
                    Status = table.Column<string>(type: "text", nullable: true),
                    Language = table.Column<string>(type: "text", nullable: true),
                    OwnerId = table.Column<int>(type: "integer", nullable: true),
                    TmdbId = table.Column<int>(type: "integer", nullable: true),
                    ImdbId = table.Column<string>(type: "text", nullable: true),
                    ImportedFrom = table.Column<string>(type: "text", nullable: true),
                    TvShowGenreId = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TvShows", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TvShows_AspNetUsers_OwnerId",
                        column: x => x.OwnerId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_TvShows_TvShowGenres_TvShowGenreId",
                        column: x => x.TvShowGenreId,
                        principalTable: "TvShowGenres",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "VideoGames",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    Platform = table.Column<int>(type: "integer", nullable: false),
                    MinPlayers = table.Column<int>(type: "integer", nullable: false),
                    MaxPlayers = table.Column<int>(type: "integer", nullable: false),
                    Genre = table.Column<string>(type: "text", nullable: true),
                    ImageKey = table.Column<string>(type: "text", nullable: true),
                    IsLocal = table.Column<bool>(type: "boolean", nullable: false),
                    IsOnline = table.Column<bool>(type: "boolean", nullable: false),
                    OwnerId = table.Column<int>(type: "integer", nullable: true),
                    SteamAppId = table.Column<int>(type: "integer", nullable: true),
                    SteamHeaderImageUrl = table.Column<string>(type: "text", nullable: true),
                    IgdbId = table.Column<int>(type: "integer", nullable: true),
                    CoverImageUrl = table.Column<string>(type: "text", nullable: true),
                    ImportedFrom = table.Column<string>(type: "text", nullable: true),
                    VideoGameGenreId = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VideoGames", x => x.Id);
                    table.ForeignKey(
                        name: "FK_VideoGames_AspNetUsers_OwnerId",
                        column: x => x.OwnerId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_VideoGames_VideoGameGenres_VideoGameGenreId",
                        column: x => x.VideoGameGenreId,
                        principalTable: "VideoGameGenres",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "WikiPageRevisions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    WikiPageId = table.Column<int>(type: "integer", nullable: false),
                    RevisionNumber = table.Column<int>(type: "integer", nullable: false),
                    ContentMarkdown = table.Column<string>(type: "text", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false),
                    EditSummary = table.Column<string>(type: "text", nullable: true),
                    EditedByUserId = table.Column<int>(type: "integer", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WikiPageRevisions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WikiPageRevisions_WikiPages_WikiPageId",
                        column: x => x.WikiPageId,
                        principalTable: "WikiPages",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Events",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Title = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    Type = table.Column<int>(type: "integer", nullable: false),
                    StartTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    EndTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    OrganizerId = table.Column<int>(type: "integer", nullable: true),
                    MaxParticipants = table.Column<int>(type: "integer", nullable: true),
                    WaitingListEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    Visibility = table.Column<int>(type: "integer", nullable: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DeletedByUserId = table.Column<int>(type: "integer", nullable: true),
                    LocationId = table.Column<int>(type: "integer", nullable: true),
                    LocationName = table.Column<string>(type: "text", nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    LocationType = table.Column<int>(type: "integer", nullable: false),
                    Access = table.Column<int>(type: "integer", nullable: false),
                    CodeHash = table.Column<string>(type: "text", nullable: true),
                    AccessToken = table.Column<string>(type: "text", nullable: true),
                    Poster = table.Column<string>(type: "text", nullable: true),
                    Recurrence = table.Column<int>(type: "integer", nullable: true),
                    RecurrenceInterval = table.Column<int>(type: "integer", nullable: true),
                    SeriesParentId = table.Column<int>(type: "integer", nullable: true),
                    CarryOverProposals = table.Column<bool>(type: "boolean", nullable: false),
                    CancellationReason = table.Column<string>(type: "text", nullable: true),
                    OriginalStartTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Name = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Events", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Events_EventLocations_LocationId",
                        column: x => x.LocationId,
                        principalTable: "EventLocations",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Events_Events_SeriesParentId",
                        column: x => x.SeriesParentId,
                        principalTable: "Events",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Events_UserProfilePlayers_OrganizerId",
                        column: x => x.OrganizerId,
                        principalTable: "UserProfilePlayers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "PlayerLinks",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    SourcePlayerId = table.Column<int>(type: "integer", nullable: false),
                    TargetPlayerId = table.Column<int>(type: "integer", nullable: false),
                    Scope = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    RevokedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PlayerLinks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PlayerLinks_UserProfilePlayers_SourcePlayerId",
                        column: x => x.SourcePlayerId,
                        principalTable: "UserProfilePlayers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PlayerLinks_UserProfilePlayers_TargetPlayerId",
                        column: x => x.TargetPlayerId,
                        principalTable: "UserProfilePlayers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PlayerProgress",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    PlayerId = table.Column<int>(type: "integer", nullable: false),
                    Category = table.Column<int>(type: "integer", nullable: false),
                    Xp = table.Column<int>(type: "integer", nullable: false),
                    Level = table.Column<int>(type: "integer", nullable: false),
                    XpToNextLevel = table.Column<int>(type: "integer", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PlayerProgress", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PlayerProgress_UserProfilePlayers_PlayerId",
                        column: x => x.PlayerId,
                        principalTable: "UserProfilePlayers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "XpTransactions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    PlayerId = table.Column<int>(type: "integer", nullable: false),
                    Category = table.Column<int>(type: "integer", nullable: false),
                    Amount = table.Column<int>(type: "integer", nullable: false),
                    Source = table.Column<string>(type: "text", nullable: false),
                    ReferenceId = table.Column<int>(type: "integer", nullable: true),
                    EarnedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_XpTransactions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_XpTransactions_UserProfilePlayers_PlayerId",
                        column: x => x.PlayerId,
                        principalTable: "UserProfilePlayers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AudioLayers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    SectionId = table.Column<int>(type: "integer", nullable: true),
                    InputPresetId = table.Column<int>(type: "integer", nullable: true),
                    AudioClipId = table.Column<int>(type: "integer", nullable: true),
                    Name = table.Column<string>(type: "text", nullable: false),
                    AudioSource = table.Column<string>(type: "text", nullable: false),
                    Duration = table.Column<TimeSpan>(type: "interval", nullable: false),
                    BPM = table.Column<decimal>(type: "numeric", nullable: false),
                    Volume = table.Column<int>(type: "integer", nullable: false),
                    AudioSourceParameters = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AudioLayers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AudioLayers_AudioClips_AudioClipId",
                        column: x => x.AudioClipId,
                        principalTable: "AudioClips",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_AudioLayers_AudioInputPresets_InputPresetId",
                        column: x => x.InputPresetId,
                        principalTable: "AudioInputPresets",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_AudioLayers_AudioSections_SectionId",
                        column: x => x.SectionId,
                        principalTable: "AudioSections",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "BoardGameCollectionBoardGames",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CollectionId = table.Column<int>(type: "integer", nullable: false),
                    BoardGameId = table.Column<int>(type: "integer", nullable: false),
                    Copies = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BoardGameCollectionBoardGames", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BoardGameCollectionBoardGames_BoardGameCollections_Collecti~",
                        column: x => x.CollectionId,
                        principalTable: "BoardGameCollections",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_BoardGameCollectionBoardGames_BoardGames_BoardGameId",
                        column: x => x.BoardGameId,
                        principalTable: "BoardGames",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "BoardGameTags",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    BoardGameId = table.Column<int>(type: "integer", nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BoardGameTags", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BoardGameTags_BoardGames_BoardGameId",
                        column: x => x.BoardGameId,
                        principalTable: "BoardGames",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "EventBoardGames",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EventId = table.Column<int>(type: "integer", nullable: false),
                    BoardGameId = table.Column<int>(type: "integer", nullable: true),
                    CopyCount = table.Column<int>(type: "integer", nullable: false),
                    Location = table.Column<string>(type: "text", nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EventBoardGames", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EventBoardGames_BoardGames_BoardGameId",
                        column: x => x.BoardGameId,
                        principalTable: "BoardGames",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "BookCollectionBooks",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CollectionId = table.Column<int>(type: "integer", nullable: false),
                    BookId = table.Column<int>(type: "integer", nullable: false),
                    AddedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BookCollectionBooks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BookCollectionBooks_BookCollections_CollectionId",
                        column: x => x.CollectionId,
                        principalTable: "BookCollections",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_BookCollectionBooks_Books_BookId",
                        column: x => x.BookId,
                        principalTable: "Books",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "BookTags",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    BookId = table.Column<int>(type: "integer", nullable: false),
                    Tag = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BookTags", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BookTags_Books_BookId",
                        column: x => x.BookId,
                        principalTable: "Books",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CampaignPlayers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CampaignId = table.Column<int>(type: "integer", nullable: false),
                    PlayerId = table.Column<int>(type: "integer", nullable: false),
                    JoinedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    TotalScore = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CampaignPlayers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CampaignPlayers_Campaigns_CampaignId",
                        column: x => x.CampaignId,
                        principalTable: "Campaigns",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CampaignPlayers_UserProfilePlayers_PlayerId",
                        column: x => x.PlayerId,
                        principalTable: "UserProfilePlayers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PlayerSkills",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    PlayerId = table.Column<int>(type: "integer", nullable: false),
                    SkillDefinitionId = table.Column<int>(type: "integer", nullable: false),
                    UnlockedInCampaignId = table.Column<int>(type: "integer", nullable: true),
                    UnlockedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UsageCount = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PlayerSkills", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PlayerSkills_Campaigns_UnlockedInCampaignId",
                        column: x => x.UnlockedInCampaignId,
                        principalTable: "Campaigns",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_PlayerSkills_SkillDefinitions_SkillDefinitionId",
                        column: x => x.SkillDefinitionId,
                        principalTable: "SkillDefinitions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PlayerSkills_UserProfilePlayers_PlayerId",
                        column: x => x.PlayerId,
                        principalTable: "UserProfilePlayers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "EventPollResponses",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    PollId = table.Column<int>(type: "integer", nullable: false),
                    OptionId = table.Column<int>(type: "integer", nullable: false),
                    RespondentEmail = table.Column<string>(type: "text", nullable: true),
                    RespondentUserId = table.Column<int>(type: "integer", nullable: true),
                    Quantity = table.Column<int>(type: "integer", nullable: false),
                    RespondedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EventPollResponses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EventPollResponses_EventPollOptions_OptionId",
                        column: x => x.OptionId,
                        principalTable: "EventPollOptions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_EventPollResponses_EventPolls_PollId",
                        column: x => x.PollId,
                        principalTable: "EventPolls",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "KaraokeSongs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    LinkedSongId = table.Column<int>(type: "integer", nullable: true),
                    Title = table.Column<string>(type: "text", nullable: false),
                    Artist = table.Column<string>(type: "text", nullable: false),
                    Genre = table.Column<string>(type: "text", nullable: false),
                    Language = table.Column<string>(type: "text", nullable: false),
                    Year = table.Column<string>(type: "text", nullable: false),
                    CoverPath = table.Column<string>(type: "text", nullable: false),
                    AudioPath = table.Column<string>(type: "text", nullable: false),
                    VideoPath = table.Column<string>(type: "text", nullable: false),
                    Gap = table.Column<int>(type: "integer", nullable: false),
                    VideoGap = table.Column<int>(type: "integer", nullable: false),
                    Start = table.Column<int>(type: "integer", nullable: false),
                    End = table.Column<int>(type: "integer", nullable: false),
                    Bpm = table.Column<decimal>(type: "numeric", nullable: false),
                    IsVerified = table.Column<bool>(type: "boolean", nullable: false),
                    InDevelopment = table.Column<bool>(type: "boolean", nullable: false),
                    OwnerId = table.Column<int>(type: "integer", nullable: true),
                    CanBeModifiedByAll = table.Column<bool>(type: "boolean", nullable: true),
                    Format = table.Column<int>(type: "integer", nullable: false),
                    FilePath = table.Column<string>(type: "text", nullable: false),
                    ExternalSource = table.Column<string>(type: "text", nullable: true),
                    ExternalId = table.Column<string>(type: "text", nullable: true),
                    ExternalCoverUrl = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KaraokeSongs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_KaraokeSongs_LibrarySongs_LinkedSongId",
                        column: x => x.LinkedSongId,
                        principalTable: "LibrarySongs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "LibraryAudioFiles",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    FilePath = table.Column<string>(type: "text", nullable: false),
                    FileName = table.Column<string>(type: "text", nullable: false),
                    Duration = table.Column<TimeSpan>(type: "interval", nullable: true),
                    SampleRate = table.Column<int>(type: "integer", nullable: true),
                    Channels = table.Column<int>(type: "integer", nullable: true),
                    BitDepth = table.Column<int>(type: "integer", nullable: true),
                    AudioMimeType = table.Column<string>(type: "text", nullable: true),
                    Genre = table.Column<string>(type: "text", nullable: true),
                    Year = table.Column<int>(type: "integer", nullable: true),
                    Lyrics = table.Column<string>(type: "text", nullable: true),
                    Size = table.Column<long>(type: "bigint", nullable: false),
                    SongId = table.Column<int>(type: "integer", nullable: true),
                    AlbumId = table.Column<int>(type: "integer", nullable: true),
                    OwnerId = table.Column<int>(type: "integer", nullable: true),
                    IsPrivate = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LibraryAudioFiles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LibraryAudioFiles_LibraryAlbums_AlbumId",
                        column: x => x.AlbumId,
                        principalTable: "LibraryAlbums",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_LibraryAudioFiles_LibrarySongs_SongId",
                        column: x => x.SongId,
                        principalTable: "LibrarySongs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "LibraryMediaFiles",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    FilePath = table.Column<string>(type: "text", nullable: false),
                    FileName = table.Column<string>(type: "text", nullable: false),
                    FileSizeBytes = table.Column<long>(type: "bigint", nullable: false),
                    MimeType = table.Column<string>(type: "text", nullable: true),
                    Codec = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    ModifiedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    SongId = table.Column<int>(type: "integer", nullable: true),
                    AlbumId = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LibraryMediaFiles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LibraryMediaFiles_LibraryAlbums_AlbumId",
                        column: x => x.AlbumId,
                        principalTable: "LibraryAlbums",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_LibraryMediaFiles_LibrarySongs_SongId",
                        column: x => x.SongId,
                        principalTable: "LibrarySongs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "LibrarySongDetails",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    SongId = table.Column<int>(type: "integer", nullable: false),
                    Type = table.Column<int>(type: "integer", nullable: false),
                    Value = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LibrarySongDetails", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LibrarySongDetails_LibrarySongs_SongId",
                        column: x => x.SongId,
                        principalTable: "LibrarySongs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PlaylistItems",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    PlaylistId = table.Column<int>(type: "integer", nullable: false),
                    OrderNumber = table.Column<int>(type: "integer", nullable: false),
                    SkipMs = table.Column<int>(type: "integer", nullable: false),
                    SongId = table.Column<int>(type: "integer", nullable: false),
                    IsRequest = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PlaylistItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PlaylistItems_LibrarySongs_SongId",
                        column: x => x.SongId,
                        principalTable: "LibrarySongs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PlaylistItems_Playlists_PlaylistId",
                        column: x => x.PlaylistId,
                        principalTable: "Playlists",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MovieCollectionMovies",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CollectionId = table.Column<int>(type: "integer", nullable: false),
                    MovieId = table.Column<int>(type: "integer", nullable: false),
                    AddedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MovieCollectionMovies", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MovieCollectionMovies_MovieCollections_CollectionId",
                        column: x => x.CollectionId,
                        principalTable: "MovieCollections",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MovieCollectionMovies_Movies_MovieId",
                        column: x => x.MovieId,
                        principalTable: "Movies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MovieTags",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    MovieId = table.Column<int>(type: "integer", nullable: false),
                    Tag = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MovieTags", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MovieTags_Movies_MovieId",
                        column: x => x.MovieId,
                        principalTable: "Movies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "OpenIddictTokens",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    ApplicationId = table.Column<string>(type: "text", nullable: true),
                    AuthorizationId = table.Column<string>(type: "text", nullable: true),
                    ConcurrencyToken = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    CreationDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ExpirationDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Payload = table.Column<string>(type: "text", nullable: true),
                    Properties = table.Column<string>(type: "text", nullable: true),
                    RedemptionDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ReferenceId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Subject = table.Column<string>(type: "character varying(400)", maxLength: 400, nullable: true),
                    Type = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OpenIddictTokens", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OpenIddictTokens_OpenIddictApplications_ApplicationId",
                        column: x => x.ApplicationId,
                        principalTable: "OpenIddictApplications",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_OpenIddictTokens_OpenIddictAuthorizations_AuthorizationId",
                        column: x => x.AuthorizationId,
                        principalTable: "OpenIddictAuthorizations",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "ContactAddresses",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ContactId = table.Column<int>(type: "integer", nullable: false),
                    Type = table.Column<int>(type: "integer", nullable: false),
                    Label = table.Column<string>(type: "text", nullable: true),
                    Street = table.Column<string>(type: "text", nullable: false),
                    Street2 = table.Column<string>(type: "text", nullable: true),
                    City = table.Column<string>(type: "text", nullable: false),
                    State = table.Column<string>(type: "text", nullable: true),
                    PostalCode = table.Column<string>(type: "text", nullable: false),
                    Country = table.Column<string>(type: "text", nullable: false),
                    IsPrimary = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ContactAddresses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ContactAddresses_Contacts_ContactId",
                        column: x => x.ContactId,
                        principalTable: "Contacts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ContactEmails",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ContactId = table.Column<int>(type: "integer", nullable: false),
                    Email = table.Column<string>(type: "text", nullable: false),
                    Type = table.Column<int>(type: "integer", nullable: false),
                    IsPrimary = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ContactEmails", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ContactEmails_Contacts_ContactId",
                        column: x => x.ContactId,
                        principalTable: "Contacts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ContactGroupMembers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    GroupId = table.Column<int>(type: "integer", nullable: false),
                    ContactId = table.Column<int>(type: "integer", nullable: false),
                    AddedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ContactGroupMembers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ContactGroupMembers_ContactGroups_GroupId",
                        column: x => x.GroupId,
                        principalTable: "ContactGroups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ContactGroupMembers_Contacts_ContactId",
                        column: x => x.ContactId,
                        principalTable: "Contacts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ContactPhones",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ContactId = table.Column<int>(type: "integer", nullable: false),
                    PhoneNumber = table.Column<string>(type: "text", nullable: false),
                    Type = table.Column<int>(type: "integer", nullable: false),
                    IsPrimary = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ContactPhones", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ContactPhones_Contacts_ContactId",
                        column: x => x.ContactId,
                        principalTable: "Contacts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "FantasyTeams",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    LeagueId = table.Column<int>(type: "integer", nullable: false),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    TotalPoints = table.Column<double>(type: "double precision", nullable: false),
                    Rank = table.Column<int>(type: "integer", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FantasyTeams", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FantasyTeams_Leagues_LeagueId",
                        column: x => x.LeagueId,
                        principalTable: "Leagues",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "LeagueParticipants",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    LeagueId = table.Column<int>(type: "integer", nullable: false),
                    UserId = table.Column<int>(type: "integer", nullable: true),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Seed = table.Column<int>(type: "integer", nullable: true),
                    Wins = table.Column<int>(type: "integer", nullable: false),
                    Losses = table.Column<int>(type: "integer", nullable: false),
                    Draws = table.Column<int>(type: "integer", nullable: false),
                    Points = table.Column<int>(type: "integer", nullable: false),
                    IsEliminated = table.Column<bool>(type: "boolean", nullable: false),
                    JoinedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LeagueParticipants", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LeagueParticipants_Leagues_LeagueId",
                        column: x => x.LeagueId,
                        principalTable: "Leagues",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SportTags",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    SportActivityId = table.Column<int>(type: "integer", nullable: false),
                    Tag = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SportTags", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SportTags_SportActivities_SportActivityId",
                        column: x => x.SportActivityId,
                        principalTable: "SportActivities",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TvShowCollectionTvShows",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CollectionId = table.Column<int>(type: "integer", nullable: false),
                    TvShowId = table.Column<int>(type: "integer", nullable: false),
                    AddedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TvShowCollectionTvShows", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TvShowCollectionTvShows_TvShowCollections_CollectionId",
                        column: x => x.CollectionId,
                        principalTable: "TvShowCollections",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TvShowCollectionTvShows_TvShows_TvShowId",
                        column: x => x.TvShowId,
                        principalTable: "TvShows",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TvShowTags",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TvShowId = table.Column<int>(type: "integer", nullable: false),
                    Tag = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TvShowTags", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TvShowTags_TvShows_TvShowId",
                        column: x => x.TvShowId,
                        principalTable: "TvShows",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "EventVideoGames",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EventId = table.Column<int>(type: "integer", nullable: false),
                    VideoGameId = table.Column<int>(type: "integer", nullable: false),
                    Station = table.Column<string>(type: "text", nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EventVideoGames", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EventVideoGames_VideoGames_VideoGameId",
                        column: x => x.VideoGameId,
                        principalTable: "VideoGames",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "VideoGameCollectionVideoGames",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CollectionId = table.Column<int>(type: "integer", nullable: false),
                    VideoGameId = table.Column<int>(type: "integer", nullable: false),
                    Copies = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VideoGameCollectionVideoGames", x => x.Id);
                    table.ForeignKey(
                        name: "FK_VideoGameCollectionVideoGames_VideoGameCollections_Collecti~",
                        column: x => x.CollectionId,
                        principalTable: "VideoGameCollections",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_VideoGameCollectionVideoGames_VideoGames_VideoGameId",
                        column: x => x.VideoGameId,
                        principalTable: "VideoGames",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "BettingMarkets",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EventId = table.Column<int>(type: "integer", nullable: false),
                    LeagueId = table.Column<int>(type: "integer", nullable: true),
                    Title = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    Type = table.Column<int>(type: "integer", nullable: false),
                    IsOpen = table.Column<bool>(type: "boolean", nullable: false),
                    WinningOptionId = table.Column<int>(type: "integer", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ResolvedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BettingMarkets", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BettingMarkets_Events_EventId",
                        column: x => x.EventId,
                        principalTable: "Events",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "BoardGameSessions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EventId = table.Column<int>(type: "integer", nullable: false),
                    StartedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    EndedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BoardGameSessions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BoardGameSessions_Events_EventId",
                        column: x => x.EventId,
                        principalTable: "Events",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "EventComments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EventId = table.Column<int>(type: "integer", nullable: false),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    Text = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    ParentId = table.Column<int>(type: "integer", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EventComments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EventComments_EventComments_ParentId",
                        column: x => x.ParentId,
                        principalTable: "EventComments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_EventComments_Events_EventId",
                        column: x => x.EventId,
                        principalTable: "Events",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "EventDateProposals",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EventId = table.Column<int>(type: "integer", nullable: false),
                    ProposedStart = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ProposedEnd = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ProposedByUserId = table.Column<int>(type: "integer", nullable: true),
                    Note = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EventDateProposals", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EventDateProposals_Events_EventId",
                        column: x => x.EventId,
                        principalTable: "Events",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "EventPhotos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EventId = table.Column<int>(type: "integer", nullable: false),
                    ObjectKey = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Caption = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    UploadedByUserId = table.Column<int>(type: "integer", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EventPhotos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EventPhotos_Events_EventId",
                        column: x => x.EventId,
                        principalTable: "Events",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "EventSessionGamePicks",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EventId = table.Column<int>(type: "integer", nullable: false),
                    SourceCollectionId = table.Column<int>(type: "integer", nullable: true),
                    BoardGameId = table.Column<int>(type: "integer", nullable: true),
                    VideoGameId = table.Column<int>(type: "integer", nullable: true),
                    GameName = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ProposedByUserId = table.Column<int>(type: "integer", nullable: true),
                    Notes = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EventSessionGamePicks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EventSessionGamePicks_Events_EventId",
                        column: x => x.EventId,
                        principalTable: "Events",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "EventSessionSongPicks",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EventId = table.Column<int>(type: "integer", nullable: false),
                    SessionId = table.Column<int>(type: "integer", nullable: false),
                    SourcePlaylistId = table.Column<int>(type: "integer", nullable: true),
                    SongId = table.Column<int>(type: "integer", nullable: false),
                    SongTitle = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EventSessionSongPicks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EventSessionSongPicks_Events_EventId",
                        column: x => x.EventId,
                        principalTable: "Events",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "KaraokeEventPlayers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EventId = table.Column<int>(type: "integer", nullable: true),
                    PlayerId = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    Permissions = table.Column<int>(type: "integer", nullable: false, defaultValue: 0)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KaraokeEventPlayers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_KaraokeEventPlayers_Events_EventId",
                        column: x => x.EventId,
                        principalTable: "Events",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_KaraokeEventPlayers_UserProfilePlayers_PlayerId",
                        column: x => x.PlayerId,
                        principalTable: "UserProfilePlayers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "KaraokeSessions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EventId = table.Column<int>(type: "integer", nullable: true),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Mode = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    StartedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    EndedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    TeamMode = table.Column<bool>(type: "boolean", nullable: false),
                    IsLimitedToEventPlaylist = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KaraokeSessions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_KaraokeSessions_Events_EventId",
                        column: x => x.EventId,
                        principalTable: "Events",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "LeagueEvents",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    LeagueId = table.Column<int>(type: "integer", nullable: false),
                    EventId = table.Column<int>(type: "integer", nullable: false),
                    RoundNumber = table.Column<int>(type: "integer", nullable: true),
                    MatchNumber = table.Column<int>(type: "integer", nullable: true),
                    Label = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LeagueEvents", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LeagueEvents_Events_EventId",
                        column: x => x.EventId,
                        principalTable: "Events",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_LeagueEvents_Leagues_LeagueId",
                        column: x => x.LeagueId,
                        principalTable: "Leagues",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "VideoGameSessions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EventId = table.Column<int>(type: "integer", nullable: false),
                    VideoGameId = table.Column<int>(type: "integer", nullable: false),
                    StartedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    EndedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VideoGameSessions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_VideoGameSessions_Events_EventId",
                        column: x => x.EventId,
                        principalTable: "Events",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_VideoGameSessions_VideoGames_VideoGameId",
                        column: x => x.VideoGameId,
                        principalTable: "VideoGames",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AudioInputMappings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserProfileId = table.Column<int>(type: "integer", nullable: true),
                    LayerId = table.Column<int>(type: "integer", nullable: true),
                    SectionId = table.Column<int>(type: "integer", nullable: true),
                    ActionName = table.Column<string>(type: "text", nullable: false),
                    DeviceType = table.Column<string>(type: "text", nullable: false),
                    DeviceId = table.Column<string>(type: "text", nullable: false),
                    InputKey = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AudioInputMappings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AudioInputMappings_AudioLayers_LayerId",
                        column: x => x.LayerId,
                        principalTable: "AudioLayers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_AudioInputMappings_AudioSections_SectionId",
                        column: x => x.SectionId,
                        principalTable: "AudioSections",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "AudioLayerEffects",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    LayerId = table.Column<int>(type: "integer", nullable: false),
                    EffectId = table.Column<int>(type: "integer", nullable: false),
                    Order = table.Column<int>(type: "integer", nullable: false),
                    ParamsOverrideJson = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AudioLayerEffects", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AudioLayerEffects_AudioEffects_EffectId",
                        column: x => x.EffectId,
                        principalTable: "AudioEffects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AudioLayerEffects_AudioLayers_LayerId",
                        column: x => x.LayerId,
                        principalTable: "AudioLayers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AudioLayerItems",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    LayerId = table.Column<int>(type: "integer", nullable: false),
                    StartTime = table.Column<TimeSpan>(type: "interval", nullable: false),
                    Parameters = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AudioLayerItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AudioLayerItems_AudioLayers_LayerId",
                        column: x => x.LayerId,
                        principalTable: "AudioLayers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CampaignRoundProgress",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CampaignId = table.Column<int>(type: "integer", nullable: false),
                    RoundNumber = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    ChosenSongId = table.Column<int>(type: "integer", nullable: true),
                    BestScore = table.Column<int>(type: "integer", nullable: true),
                    XpEarned = table.Column<int>(type: "integer", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    SingingId = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CampaignRoundProgress", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CampaignRoundProgress_Campaigns_CampaignId",
                        column: x => x.CampaignId,
                        principalTable: "Campaigns",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CampaignRoundProgress_KaraokeSongs_ChosenSongId",
                        column: x => x.ChosenSongId,
                        principalTable: "KaraokeSongs",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "CampaignTemplateRoundSongs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TemplateRoundId = table.Column<int>(type: "integer", nullable: false),
                    SongId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CampaignTemplateRoundSongs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CampaignTemplateRoundSongs_CampaignTemplateRounds_TemplateR~",
                        column: x => x.TemplateRoundId,
                        principalTable: "CampaignTemplateRounds",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CampaignTemplateRoundSongs_KaraokeSongs_SongId",
                        column: x => x.SongId,
                        principalTable: "KaraokeSongs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "FavoriteSongs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    PlayerId = table.Column<int>(type: "integer", nullable: false),
                    SongId = table.Column<int>(type: "integer", nullable: false),
                    AddedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FavoriteSongs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FavoriteSongs_KaraokeSongs_SongId",
                        column: x => x.SongId,
                        principalTable: "KaraokeSongs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_FavoriteSongs_UserProfilePlayers_PlayerId",
                        column: x => x.PlayerId,
                        principalTable: "UserProfilePlayers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "KaraokePlaylistSong",
                columns: table => new
                {
                    PlaylistId = table.Column<int>(type: "integer", nullable: false),
                    SongId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KaraokePlaylistSong", x => new { x.PlaylistId, x.SongId });
                    table.ForeignKey(
                        name: "FK_KaraokePlaylistSong_KaraokePlaylists_PlaylistId",
                        column: x => x.PlaylistId,
                        principalTable: "KaraokePlaylists",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_KaraokePlaylistSong_KaraokeSongs_SongId",
                        column: x => x.SongId,
                        principalTable: "KaraokeSongs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "KaraokeSongCollaborators",
                columns: table => new
                {
                    SongId = table.Column<int>(type: "integer", nullable: false),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    Permission = table.Column<int>(type: "integer", nullable: false, defaultValue: 0)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KaraokeSongCollaborators", x => new { x.SongId, x.UserId });
                    table.ForeignKey(
                        name: "FK_KaraokeSongCollaborators_KaraokeSongs_SongId",
                        column: x => x.SongId,
                        principalTable: "KaraokeSongs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "KaraokeSongFileNote",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    SongId = table.Column<int>(type: "integer", nullable: false),
                    NoteLine = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KaraokeSongFileNote", x => x.Id);
                    table.ForeignKey(
                        name: "FK_KaraokeSongFileNote_KaraokeSongs_SongId",
                        column: x => x.SongId,
                        principalTable: "KaraokeSongs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "KaraokeSongQueueItems",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EventId = table.Column<int>(type: "integer", nullable: false),
                    SongId = table.Column<int>(type: "integer", nullable: false),
                    RequestedByPlayerId = table.Column<int>(type: "integer", nullable: false),
                    Position = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    RequestedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KaraokeSongQueueItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_KaraokeSongQueueItems_KaraokeSongs_SongId",
                        column: x => x.SongId,
                        principalTable: "KaraokeSongs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_KaraokeSongQueueItems_UserProfilePlayers_RequestedByPlayerId",
                        column: x => x.RequestedByPlayerId,
                        principalTable: "UserProfilePlayers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SongDanceMatches",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    SongId = table.Column<int>(type: "integer", nullable: false),
                    DanceStyleId = table.Column<int>(type: "integer", nullable: false),
                    Confidence = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: false),
                    Source = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    AnalyzedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SongDanceMatches", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SongDanceMatches_DanceStyles_DanceStyleId",
                        column: x => x.DanceStyleId,
                        principalTable: "DanceStyles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SongDanceMatches_KaraokeSongs_SongId",
                        column: x => x.SongId,
                        principalTable: "KaraokeSongs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "FantasyTeamPlayers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    FantasyTeamId = table.Column<int>(type: "integer", nullable: false),
                    ExternalPlayerId = table.Column<string>(type: "text", nullable: true),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Position = table.Column<string>(type: "text", nullable: true),
                    RealTeam = table.Column<string>(type: "text", nullable: true),
                    Points = table.Column<double>(type: "double precision", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    DraftOrder = table.Column<int>(type: "integer", nullable: true),
                    AddedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FantasyTeamPlayers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FantasyTeamPlayers_FantasyTeams_FantasyTeamId",
                        column: x => x.FantasyTeamId,
                        principalTable: "FantasyTeams",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "BettingOptions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    MarketId = table.Column<int>(type: "integer", nullable: false),
                    Label = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Odds = table.Column<decimal>(type: "numeric(10,4)", precision: 10, scale: 4, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BettingOptions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BettingOptions_BettingMarkets_MarketId",
                        column: x => x.MarketId,
                        principalTable: "BettingMarkets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "BoardGameSessionRounds",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    SessionId = table.Column<int>(type: "integer", nullable: false),
                    Number = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BoardGameSessionRounds", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BoardGameSessionRounds_BoardGameSessions_SessionId",
                        column: x => x.SessionId,
                        principalTable: "BoardGameSessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "EventDateVotes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ProposalId = table.Column<int>(type: "integer", nullable: false),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    Comment = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    VotedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EventDateVotes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EventDateVotes_EventDateProposals_ProposalId",
                        column: x => x.ProposalId,
                        principalTable: "EventDateProposals",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "EventSessionGameVotes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    PickId = table.Column<int>(type: "integer", nullable: false),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    Priority = table.Column<int>(type: "integer", nullable: true),
                    VotedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EventSessionGameVotes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EventSessionGameVotes_EventSessionGamePicks_PickId",
                        column: x => x.PickId,
                        principalTable: "EventSessionGamePicks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "EventSessionSongSignups",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    PickId = table.Column<int>(type: "integer", nullable: false),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    PreferredSlot = table.Column<int>(type: "integer", nullable: true),
                    SignedUpAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EventSessionSongSignups", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EventSessionSongSignups_EventSessionSongPicks_PickId",
                        column: x => x.PickId,
                        principalTable: "EventSessionSongPicks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "KaraokeEventRounds",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EventId = table.Column<int>(type: "integer", nullable: true),
                    SessionId = table.Column<int>(type: "integer", nullable: true),
                    PlaylistId = table.Column<int>(type: "integer", nullable: true),
                    SongId = table.Column<int>(type: "integer", nullable: false),
                    Number = table.Column<int>(type: "integer", nullable: false),
                    StartTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    PerformedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    TeamMode = table.Column<bool>(type: "boolean", nullable: false),
                    Mode = table.Column<int>(type: "integer", nullable: false),
                    DurationLimitSeconds = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KaraokeEventRounds", x => x.Id);
                    table.ForeignKey(
                        name: "FK_KaraokeEventRounds_Events_EventId",
                        column: x => x.EventId,
                        principalTable: "Events",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_KaraokeEventRounds_KaraokePlaylists_PlaylistId",
                        column: x => x.PlaylistId,
                        principalTable: "KaraokePlaylists",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_KaraokeEventRounds_KaraokeSessions_SessionId",
                        column: x => x.SessionId,
                        principalTable: "KaraokeSessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_KaraokeEventRounds_KaraokeSongs_SongId",
                        column: x => x.SongId,
                        principalTable: "KaraokeSongs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "KaraokeSessionPlaylist",
                columns: table => new
                {
                    SessionId = table.Column<int>(type: "integer", nullable: false),
                    PlaylistId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KaraokeSessionPlaylist", x => new { x.SessionId, x.PlaylistId });
                    table.ForeignKey(
                        name: "FK_KaraokeSessionPlaylist_KaraokePlaylists_PlaylistId",
                        column: x => x.PlaylistId,
                        principalTable: "KaraokePlaylists",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_KaraokeSessionPlaylist_KaraokeSessions_SessionId",
                        column: x => x.SessionId,
                        principalTable: "KaraokeSessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "KaraokeSessionSongPicks",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    SessionId = table.Column<int>(type: "integer", nullable: false),
                    SourcePlaylistId = table.Column<int>(type: "integer", nullable: true),
                    SongId = table.Column<int>(type: "integer", nullable: false),
                    SongTitle = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KaraokeSessionSongPicks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_KaraokeSessionSongPicks_KaraokeSessions_SessionId",
                        column: x => x.SessionId,
                        principalTable: "KaraokeSessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_KaraokeSessionSongPicks_KaraokeSongs_SongId",
                        column: x => x.SongId,
                        principalTable: "KaraokeSongs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "KaraokeTeams",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "text", nullable: false),
                    EventId = table.Column<int>(type: "integer", nullable: true),
                    CreatedByPlayerId = table.Column<int>(type: "integer", nullable: false),
                    AvatarKey = table.Column<string>(type: "text", nullable: true),
                    Color = table.Column<string>(type: "text", nullable: true),
                    KaraokeSessionId = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KaraokeTeams", x => x.Id);
                    table.ForeignKey(
                        name: "FK_KaraokeTeams_KaraokeSessions_KaraokeSessionId",
                        column: x => x.KaraokeSessionId,
                        principalTable: "KaraokeSessions",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_KaraokeTeams_UserProfilePlayers_CreatedByPlayerId",
                        column: x => x.CreatedByPlayerId,
                        principalTable: "UserProfilePlayers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "VideoGameSessionPlayers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    SessionId = table.Column<int>(type: "integer", nullable: false),
                    PlayerId = table.Column<int>(type: "integer", nullable: false),
                    Score = table.Column<int>(type: "integer", nullable: true),
                    JoinedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VideoGameSessionPlayers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_VideoGameSessionPlayers_VideoGameSessions_SessionId",
                        column: x => x.SessionId,
                        principalTable: "VideoGameSessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "VideoGameSessionRounds",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    SessionId = table.Column<int>(type: "integer", nullable: false),
                    Number = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VideoGameSessionRounds", x => x.Id);
                    table.ForeignKey(
                        name: "FK_VideoGameSessionRounds_VideoGameSessions_SessionId",
                        column: x => x.SessionId,
                        principalTable: "VideoGameSessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Bets",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    MarketId = table.Column<int>(type: "integer", nullable: false),
                    OptionId = table.Column<int>(type: "integer", nullable: false),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    Amount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    PotentialPayout = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    Won = table.Column<bool>(type: "boolean", nullable: true),
                    ActualPayout = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    PlacedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Bets", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Bets_BettingMarkets_MarketId",
                        column: x => x.MarketId,
                        principalTable: "BettingMarkets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Bets_BettingOptions_OptionId",
                        column: x => x.OptionId,
                        principalTable: "BettingOptions",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "BoardGameSessionRoundParts",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    RoundId = table.Column<int>(type: "integer", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Duration = table.Column<TimeSpan>(type: "interval", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BoardGameSessionRoundParts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BoardGameSessionRoundParts_BoardGameSessionRounds_RoundId",
                        column: x => x.RoundId,
                        principalTable: "BoardGameSessionRounds",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "KaraokeRoundParts",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    RoundId = table.Column<int>(type: "integer", nullable: false),
                    PartNumber = table.Column<int>(type: "integer", nullable: false),
                    PlayerId = table.Column<int>(type: "integer", nullable: false),
                    PerformedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KaraokeRoundParts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_KaraokeRoundParts_KaraokeEventRounds_RoundId",
                        column: x => x.RoundId,
                        principalTable: "KaraokeEventRounds",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_KaraokeRoundParts_UserProfilePlayers_PlayerId",
                        column: x => x.PlayerId,
                        principalTable: "UserProfilePlayers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "KaraokeRoundPlayers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    RoundId = table.Column<int>(type: "integer", nullable: false),
                    PlayerId = table.Column<int>(type: "integer", nullable: false),
                    Slot = table.Column<int>(type: "integer", nullable: false),
                    JoinedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KaraokeRoundPlayers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_KaraokeRoundPlayers_KaraokeEventRounds_RoundId",
                        column: x => x.RoundId,
                        principalTable: "KaraokeEventRounds",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_KaraokeRoundPlayers_UserProfilePlayers_PlayerId",
                        column: x => x.PlayerId,
                        principalTable: "UserProfilePlayers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "KaraokeSessionSongSignups",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    PickId = table.Column<int>(type: "integer", nullable: false),
                    PlayerId = table.Column<int>(type: "integer", nullable: false),
                    PreferredSlot = table.Column<int>(type: "integer", nullable: true),
                    SignedUpAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KaraokeSessionSongSignups", x => x.Id);
                    table.ForeignKey(
                        name: "FK_KaraokeSessionSongSignups_KaraokeSessionSongPicks_PickId",
                        column: x => x.PickId,
                        principalTable: "KaraokeSessionSongPicks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_KaraokeSessionSongSignups_UserProfilePlayers_PlayerId",
                        column: x => x.PlayerId,
                        principalTable: "UserProfilePlayers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "KaraokeTeamPlayers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    PlayerId = table.Column<int>(type: "integer", nullable: false),
                    TeamId = table.Column<int>(type: "integer", nullable: false),
                    JoinedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Role = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KaraokeTeamPlayers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_KaraokeTeamPlayers_KaraokeTeams_TeamId",
                        column: x => x.TeamId,
                        principalTable: "KaraokeTeams",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_KaraokeTeamPlayers_UserProfilePlayers_PlayerId",
                        column: x => x.PlayerId,
                        principalTable: "UserProfilePlayers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "VideoGameSessionRoundParts",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    RoundId = table.Column<int>(type: "integer", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Duration = table.Column<TimeSpan>(type: "interval", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VideoGameSessionRoundParts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_VideoGameSessionRoundParts_VideoGameSessionRounds_RoundId",
                        column: x => x.RoundId,
                        principalTable: "VideoGameSessionRounds",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "BoardGameSessionRoundPartPlayers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    PartId = table.Column<int>(type: "integer", nullable: false),
                    PlayerId = table.Column<int>(type: "integer", nullable: false),
                    Score = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BoardGameSessionRoundPartPlayers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BoardGameSessionRoundPartPlayers_BoardGameSessionRoundParts~",
                        column: x => x.PartId,
                        principalTable: "BoardGameSessionRoundParts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "KaraokeSingings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    RoundId = table.Column<int>(type: "integer", nullable: false),
                    RoundPartId = table.Column<int>(type: "integer", nullable: true),
                    PlayerId = table.Column<int>(type: "integer", nullable: false),
                    Score = table.Column<int>(type: "integer", nullable: false),
                    Hits = table.Column<int>(type: "integer", nullable: false),
                    Misses = table.Column<int>(type: "integer", nullable: false),
                    Good = table.Column<int>(type: "integer", nullable: false),
                    Perfect = table.Column<int>(type: "integer", nullable: false),
                    Combo = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KaraokeSingings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_KaraokeSingings_KaraokeEventRounds_RoundId",
                        column: x => x.RoundId,
                        principalTable: "KaraokeEventRounds",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_KaraokeSingings_KaraokeRoundParts_RoundPartId",
                        column: x => x.RoundPartId,
                        principalTable: "KaraokeRoundParts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_KaraokeSingings_UserProfilePlayers_PlayerId",
                        column: x => x.PlayerId,
                        principalTable: "UserProfilePlayers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "VideoGameSessionRoundPartPlayers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    PartId = table.Column<int>(type: "integer", nullable: false),
                    PlayerId = table.Column<int>(type: "integer", nullable: false),
                    Score = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VideoGameSessionRoundPartPlayers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_VideoGameSessionRoundPartPlayers_VideoGameSessionRoundParts~",
                        column: x => x.PartId,
                        principalTable: "VideoGameSessionRoundParts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "KaraokeSingingRecording",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    SingingId = table.Column<int>(type: "integer", nullable: false),
                    FileName = table.Column<string>(type: "text", nullable: false),
                    Data = table.Column<byte[]>(type: "bytea", nullable: false),
                    Type = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KaraokeSingingRecording", x => x.Id);
                    table.ForeignKey(
                        name: "FK_KaraokeSingingRecording_KaraokeSingings_SingingId",
                        column: x => x.SingingId,
                        principalTable: "KaraokeSingings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "AdminScoringPresets",
                columns: new[] { "Id", "DataJson", "ModifiedAt", "ModifiedByUserId", "ModifiedByUsername" },
                values: new object[] { 1, "{\"easy\":{\"semitoneTolerance\":2,\"preWindow\":0.25,\"postExtra\":0.3,\"difficultyMult\":0.9},\"normal\":{\"semitoneTolerance\":1,\"preWindow\":0.15,\"postExtra\":0.2,\"difficultyMult\":1.0},\"hard\":{\"semitoneTolerance\":0,\"preWindow\":0.08,\"postExtra\":0.12,\"difficultyMult\":1.05}}", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "system" });

            migrationBuilder.InsertData(
                table: "SkinThemes",
                columns: new[] { "Id", "BodyBackground", "CreatedAt", "Description", "Emoji", "IsActive", "IsDark", "IsDeleted", "IsSystem", "Name", "SortOrder", "UpdatedAt", "Vars" },
                values: new object[,]
                {
                    { 1, "linear-gradient(135deg, #0f0c29, #302b63, #24243e)", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Domyślny ciemny motyw", "🌙", true, true, false, true, "Default Dark", 1, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "{\"--bg-primary\":\"#1a1a2e\",\"--bg-secondary\":\"#16213e\",\"--bg-card\":\"#0f3460\",\"--text-primary\":\"#e0e0e0\",\"--text-secondary\":\"#a0a0a0\",\"--accent\":\"#e94560\",\"--accent-hover\":\"#ff6b6b\",\"--border\":\"#2a2a4a\"}" },
                    { 2, "linear-gradient(135deg, #f5f7fa, #c3cfe2)", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Domyślny jasny motyw", "☀️", true, false, false, true, "Default Light", 2, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "{\"--bg-primary\":\"#ffffff\",\"--bg-secondary\":\"#f8f9fa\",\"--bg-card\":\"#ffffff\",\"--text-primary\":\"#212529\",\"--text-secondary\":\"#6c757d\",\"--accent\":\"#0d6efd\",\"--accent-hover\":\"#0b5ed7\",\"--border\":\"#dee2e6\"}" },
                    { 3, "linear-gradient(135deg, #0a0a0a, #1a0030, #000033)", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Neonowy motyw imprezowy", "🎉", true, true, false, true, "Neon Event", 3, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "{\"--bg-primary\":\"#0a0a0a\",\"--bg-secondary\":\"#1a0030\",\"--bg-card\":\"#1a1a2e\",\"--text-primary\":\"#f0f0f0\",\"--text-secondary\":\"#b0b0b0\",\"--accent\":\"#ff00ff\",\"--accent-hover\":\"#ff66ff\",\"--border\":\"#3a0060\"}" },
                    { 4, "linear-gradient(180deg,#0b0711,#2a2130)", new DateTime(2026, 2, 16, 0, 0, 0, 0, DateTimeKind.Utc), "Gładkie, aksamitne odcienie", "🖤", true, true, false, true, "Velvet Night", 4, new DateTime(2026, 2, 16, 0, 0, 0, 0, DateTimeKind.Utc), "{\"--bg-primary\":\"#0b0711\",\"--bg-secondary\":\"#1a1220\",\"--bg-card\":\"#241628\",\"--text-primary\":\"#fdeff2\",\"--text-secondary\":\"#d8b7c9\",\"--accent\":\"#ff6fa3\",\"--accent-hover\":\"#ff94c2\",\"--border\":\"#3b2130\"}" },
                    { 5, "linear-gradient(180deg,#fff5e6,#fff0d1)", new DateTime(2026, 2, 16, 0, 0, 0, 0, DateTimeKind.Utc), "Ciepłe, przyprawowe tony", "🟠", true, false, false, true, "Saffron Glow", 5, new DateTime(2026, 2, 16, 0, 0, 0, 0, DateTimeKind.Utc), "{\"--bg-primary\":\"#fff8f0\",\"--bg-secondary\":\"#fff2e0\",\"--bg-card\":\"#fff1dd\",\"--text-primary\":\"#2b2b2b\",\"--text-secondary\":\"#5a4a3a\",\"--accent\":\"#ff8a00\",\"--accent-hover\":\"#ffa733\",\"--border\":\"#e6c9b0\"}" },
                    { 6, "linear-gradient(180deg,#2b0a0a,#3b0f0f)", new DateTime(2026, 2, 16, 0, 0, 0, 0, DateTimeKind.Utc), "Zmysłowa czerwień i jedwab", "🩸", true, true, false, true, "Crimson Silk", 6, new DateTime(2026, 2, 16, 0, 0, 0, 0, DateTimeKind.Utc), "{\"--bg-primary\":\"#1b0a0a\",\"--bg-secondary\":\"#2b0f0f\",\"--bg-card\":\"#3a1414\",\"--text-primary\":\"#fff2f2\",\"--text-secondary\":\"#f0b6b6\",\"--accent\":\"#d32f2f\",\"--accent-hover\":\"#ff5252\",\"--border\":\"#4a1a1a\"}" },
                    { 7, "linear-gradient(180deg,#fff9e6,#fff1cc)", new DateTime(2026, 2, 16, 0, 0, 0, 0, DateTimeKind.Utc), "Miodowe, przytulne barwy", "💛", true, false, false, true, "Amber Kiss", 7, new DateTime(2026, 2, 16, 0, 0, 0, 0, DateTimeKind.Utc), "{\"--bg-primary\":\"#fffaf0\",\"--bg-secondary\":\"#fff3d9\",\"--bg-card\":\"#fff1cc\",\"--text-primary\":\"#231f20\",\"--text-secondary\":\"#7a5a2b\",\"--accent\":\"#ffb300\",\"--accent-hover\":\"#ffc633\",\"--border\":\"#f0d9b5\"}" },
                    { 8, "linear-gradient(180deg,#150018,#2a002b)", new DateTime(2026, 2, 16, 0, 0, 0, 0, DateTimeKind.Utc), "Głębokie purpury", "🍇", true, true, false, true, "Velvet Plum", 8, new DateTime(2026, 2, 16, 0, 0, 0, 0, DateTimeKind.Utc), "{\"--bg-primary\":\"#0f0011\",\"--bg-secondary\":\"#210019\",\"--bg-card\":\"#2b001f\",\"--text-primary\":\"#fff7fb\",\"--text-secondary\":\"#d8bfe6\",\"--accent\":\"#9b59b6\",\"--accent-hover\":\"#c17bdc\",\"--border\":\"#3a1630\"}" },
                    { 9, "linear-gradient(180deg,#fff6f8,#fff1f3)", new DateTime(2026, 2, 16, 0, 0, 0, 0, DateTimeKind.Utc), "Subtelne róże i beże", "🌹", true, false, false, true, "Rose Whisper", 9, new DateTime(2026, 2, 16, 0, 0, 0, 0, DateTimeKind.Utc), "{\"--bg-primary\":\"#fff8f9\",\"--bg-secondary\":\"#fff2f4\",\"--bg-card\":\"#fff1f2\",\"--text-primary\":\"#2b1f22\",\"--text-secondary\":\"#8b5b63\",\"--accent\":\"#d81b60\",\"--accent-hover\":\"#ff4081\",\"--border\":\"#f3d7db\"}" },
                    { 10, "linear-gradient(180deg,#0b0820,#241238)", new DateTime(2026, 2, 16, 0, 0, 0, 0, DateTimeKind.Utc), "Kwiatowy motyw nocny", "🌺", true, true, false, true, "Midnight Bloom", 10, new DateTime(2026, 2, 16, 0, 0, 0, 0, DateTimeKind.Utc), "{\"--bg-primary\":\"#070614\",\"--bg-secondary\":\"#1a0f25\",\"--bg-card\":\"#2b142b\",\"--text-primary\":\"#fff6f8\",\"--text-secondary\":\"#e6bfd6\",\"--accent\":\"#ff4081\",\"--accent-hover\":\"#ff79a8\",\"--border\":\"#3a0e2a\"}" },
                    { 11, "linear-gradient(180deg,#0d0810,#2b1a09)", new DateTime(2026, 2, 16, 0, 0, 0, 0, DateTimeKind.Utc), "Ciepła noc pod księżycem", "🌕", true, true, false, true, "Moonlit Amber", 11, new DateTime(2026, 2, 16, 0, 0, 0, 0, DateTimeKind.Utc), "{\"--bg-primary\":\"#0b0908\",\"--bg-secondary\":\"#22170f\",\"--bg-card\":\"#2f1f14\",\"--text-primary\":\"#fff7e6\",\"--text-secondary\":\"#ead3b8\",\"--accent\":\"#ffb74d\",\"--accent-hover\":\"#ffd27a\",\"--border\":\"#3a2a1f\"}" },
                    { 12, "linear-gradient(180deg,#000,#1a1a1a)", new DateTime(2026, 2, 16, 0, 0, 0, 0, DateTimeKind.Utc), "Elegancka czerń i kontrasty", "🕶️", true, true, false, true, "Silk Noir", 12, new DateTime(2026, 2, 16, 0, 0, 0, 0, DateTimeKind.Utc), "{\"--bg-primary\":\"#000000\",\"--bg-secondary\":\"#0f0f0f\",\"--bg-card\":\"#121212\",\"--text-primary\":\"#f8f8f8\",\"--text-secondary\":\"#bfbfbf\",\"--accent\":\"#9e9e9e\",\"--accent-hover\":\"#cfcfcf\",\"--border\":\"#222222\"}" },
                    { 13, "linear-gradient(180deg,#fff7f3,#f7ede6)", new DateTime(2026, 2, 16, 0, 0, 0, 0, DateTimeKind.Utc), "Czekoladowe tony", "🍫", true, false, false, true, "Cocoa Mist", 13, new DateTime(2026, 2, 16, 0, 0, 0, 0, DateTimeKind.Utc), "{\"--bg-primary\":\"#fff9f6\",\"--bg-secondary\":\"#fff2ee\",\"--bg-card\":\"#f6e8e0\",\"--text-primary\":\"#2b1e1c\",\"--text-secondary\":\"#7a5a4f\",\"--accent\":\"#6d4c41\",\"--accent-hover\":\"#8d6e63\",\"--border\":\"#ecdacb\"}" },
                    { 14, "linear-gradient(180deg,#061018,#12202a)", new DateTime(2026, 2, 16, 0, 0, 0, 0, DateTimeKind.Utc), "Migoczące odcienie", "💎", true, true, false, true, "Opal Dusk", 14, new DateTime(2026, 2, 16, 0, 0, 0, 0, DateTimeKind.Utc), "{\"--bg-primary\":\"#061018\",\"--bg-secondary\":\"#0f2530\",\"--bg-card\":\"#172a34\",\"--text-primary\":\"#f3fbff\",\"--text-secondary\":\"#bcd7e6\",\"--accent\":\"#7fd3ff\",\"--accent-hover\":\"#b7f0ff\",\"--border\":\"#13303a\"}" },
                    { 15, "linear-gradient(180deg,#fff8f2,#ffeedb)", new DateTime(2026, 2, 16, 0, 0, 0, 0, DateTimeKind.Utc), "Pustynne, zmysłowe barwy", "🏜️", true, false, false, true, "Desert Rose", 15, new DateTime(2026, 2, 16, 0, 0, 0, 0, DateTimeKind.Utc), "{\"--bg-primary\":\"#fffaf5\",\"--bg-secondary\":\"#fff2e8\",\"--bg-card\":\"#fff0de\",\"--text-primary\":\"#2b1f18\",\"--text-secondary\":\"#8a6f62\",\"--accent\":\"#d88b5f\",\"--accent-hover\":\"#ffa66e\",\"--border\":\"#edd6c2\"}" },
                    { 16, "linear-gradient(180deg,#030412,#0b1220)", new DateTime(2026, 2, 16, 0, 0, 0, 0, DateTimeKind.Utc), "Chłodne, miękkie cienie", "🌒", true, true, false, true, "Moonshadow", 16, new DateTime(2026, 2, 16, 0, 0, 0, 0, DateTimeKind.Utc), "{\"--bg-primary\":\"#030412\",\"--bg-secondary\":\"#0b1220\",\"--bg-card\":\"#131827\",\"--text-primary\":\"#e8f0ff\",\"--text-secondary\":\"#aabddf\",\"--accent\":\"#5ea3ff\",\"--accent-hover\":\"#8fc3ff\",\"--border\":\"#1d2b3a\"}" },
                    { 17, "linear-gradient(180deg,#fffaf8,#f6efe9)", new DateTime(2026, 2, 16, 0, 0, 0, 0, DateTimeKind.Utc), "Drewniane, ciepłe odcienie", "🪵", true, false, false, true, "Rosewood", 17, new DateTime(2026, 2, 16, 0, 0, 0, 0, DateTimeKind.Utc), "{\"--bg-primary\":\"#fff9f6\",\"--bg-secondary\":\"#f7efe8\",\"--bg-card\":\"#efe3dc\",\"--text-primary\":\"#2b1c16\",\"--text-secondary\":\"#89614e\",\"--accent\":\"#a0522d\",\"--accent-hover\":\"#c76b43\",\"--border\":\"#e7d0c0\"}" },
                    { 18, "linear-gradient(180deg,#f6fbff,#eaf6ff)", new DateTime(2026, 2, 16, 0, 0, 0, 0, DateTimeKind.Utc), "Błękitne jedwabie", "🔵", true, false, false, true, "Silken Azure", 18, new DateTime(2026, 2, 16, 0, 0, 0, 0, DateTimeKind.Utc), "{\"--bg-primary\":\"#f8fdff\",\"--bg-secondary\":\"#eff8ff\",\"--bg-card\":\"#eaf6ff\",\"--text-primary\":\"#12202a\",\"--text-secondary\":\"#4a6b78\",\"--accent\":\"#2196f3\",\"--accent-hover\":\"#42a5f5\",\"--border\":\"#d7eaf8\"}" },
                    { 19, "linear-gradient(180deg,#040014,#1a0029)", new DateTime(2026, 2, 16, 0, 0, 0, 0, DateTimeKind.Utc), "Muzyczna atmosfera nocy", "🎼", true, true, false, true, "Nocturne", 19, new DateTime(2026, 2, 16, 0, 0, 0, 0, DateTimeKind.Utc), "{\"--bg-primary\":\"#030012\",\"--bg-secondary\":\"#1a0029\",\"--bg-card\":\"#2b0533\",\"--text-primary\":\"#fffafc\",\"--text-secondary\":\"#d8c7e6\",\"--accent\":\"#c2185b\",\"--accent-hover\":\"#e91e63\",\"--border\":\"#3a0f2a\"}" },
                    { 20, "linear-gradient(180deg,#fff8ff,#f6f0ff)", new DateTime(2026, 2, 16, 0, 0, 0, 0, DateTimeKind.Utc), "Lawendowa miękkość", "💜", true, false, false, true, "Lavender Haze", 20, new DateTime(2026, 2, 16, 0, 0, 0, 0, DateTimeKind.Utc), "{\"--bg-primary\":\"#fff9ff\",\"--bg-secondary\":\"#f7f0ff\",\"--bg-card\":\"#f2eaff\",\"--text-primary\":\"#21122b\",\"--text-secondary\":\"#6b4f72\",\"--accent\":\"#9c27b0\",\"--accent-hover\":\"#b66cd9\",\"--border\":\"#ecdff0\"}" },
                    { 21, "linear-gradient(180deg,#12000a,#2b0016)", new DateTime(2026, 2, 16, 0, 0, 0, 0, DateTimeKind.Utc), "Intensywna, zmysłowa paleta", "💋", true, true, false, true, "Seduction", 21, new DateTime(2026, 2, 16, 0, 0, 0, 0, DateTimeKind.Utc), "{\"--bg-primary\":\"#0c0305\",\"--bg-secondary\":\"#230412\",\"--bg-card\":\"#341022\",\"--text-primary\":\"#ffeef1\",\"--text-secondary\":\"#f2b8c0\",\"--accent\":\"#e91e63\",\"--accent-hover\":\"#ff6090\",\"--border\":\"#4a1220\"}" },
                    { 22, "linear-gradient(180deg,#fff7f5,#ffece8)", new DateTime(2026, 2, 16, 0, 0, 0, 0, DateTimeKind.Utc), "Korale i delikatność", "🧡", true, false, false, true, "Coral Veil", 22, new DateTime(2026, 2, 16, 0, 0, 0, 0, DateTimeKind.Utc), "{\"--bg-primary\":\"#fff8f7\",\"--bg-secondary\":\"#fff0ee\",\"--bg-card\":\"#ffece8\",\"--text-primary\":\"#231617\",\"--text-secondary\":\"#8b5a52\",\"--accent\":\"#ff6f61\",\"--accent-hover\":\"#ff8b77\",\"--border\":\"#f4d7d0\"}" },
                    { 23, "linear-gradient(180deg,#170006,#3b0610)", new DateTime(2026, 2, 16, 0, 0, 0, 0, DateTimeKind.Utc), "Bogata, klejnotowa czerwień", "🔴", true, true, false, true, "Garnet", 23, new DateTime(2026, 2, 16, 0, 0, 0, 0, DateTimeKind.Utc), "{\"--bg-primary\":\"#0d0304\",\"--bg-secondary\":\"#2b0506\",\"--bg-card\":\"#3a0c0f\",\"--text-primary\":\"#fff3f3\",\"--text-secondary\":\"#e6bdbd\",\"--accent\":\"#b71c1c\",\"--accent-hover\":\"#e53935\",\"--border\":\"#4a1415\"}" },
                    { 24, "linear-gradient(180deg,#fbfbff,#f1f0ff)", new DateTime(2026, 2, 16, 0, 0, 0, 0, DateTimeKind.Utc), "Perłowe, półprzezroczyste odcienie", "🟣", true, false, false, true, "Opaline", 24, new DateTime(2026, 2, 16, 0, 0, 0, 0, DateTimeKind.Utc), "{\"--bg-primary\":\"#ffffff\",\"--bg-secondary\":\"#f8f8ff\",\"--bg-card\":\"#f6f6ff\",\"--text-primary\":\"#1a1620\",\"--text-secondary\":\"#6b6070\",\"--accent\":\"#8e7cc3\",\"--accent-hover\":\"#b39ddb\",\"--border\":\"#e9e6f2\"}" },
                    { 25, "linear-gradient(180deg,#010101,#151515)", new DateTime(2026, 2, 16, 0, 0, 0, 0, DateTimeKind.Utc), "Minimalistyczna elegancja", "🖤", true, true, false, true, "Silhouette", 25, new DateTime(2026, 2, 16, 0, 0, 0, 0, DateTimeKind.Utc), "{\"--bg-primary\":\"#050505\",\"--bg-secondary\":\"#0f0f0f\",\"--bg-card\":\"#171717\",\"--text-primary\":\"#f8f8f8\",\"--text-secondary\":\"#9e9e9e\",\"--accent\":\"#607d8b\",\"--accent-hover\":\"#90a4ae\",\"--border\":\"#202020\"}" },
                    { 26, "linear-gradient(180deg,#fffaf3,#fff1e0)", new DateTime(2026, 2, 16, 0, 0, 0, 0, DateTimeKind.Utc), "Słodkie, ciepłe pastele", "🍯", true, false, false, true, "Honeyed", 26, new DateTime(2026, 2, 16, 0, 0, 0, 0, DateTimeKind.Utc), "{\"--bg-primary\":\"#fffaf6\",\"--bg-secondary\":\"#fff2ea\",\"--bg-card\":\"#fff0e6\",\"--text-primary\":\"#2c1f18\",\"--text-secondary\":\"#8a6f5f\",\"--accent\":\"#ffb74d\",\"--accent-hover\":\"#ffd27a\",\"--border\":\"#f0d8c0\"}" },
                    { 27, "linear-gradient(180deg,#00010a,#0b0a1a)", new DateTime(2026, 2, 16, 0, 0, 0, 0, DateTimeKind.Utc), "Głębokie, kontrastowe tony", "🌑", true, true, false, true, "Eclipse", 27, new DateTime(2026, 2, 16, 0, 0, 0, 0, DateTimeKind.Utc), "{\"--bg-primary\":\"#00020a\",\"--bg-secondary\":\"#0a0914\",\"--bg-card\":\"#12121b\",\"--text-primary\":\"#eef2ff\",\"--text-secondary\":\"#aab0d8\",\"--accent\":\"#536dfe\",\"--accent-hover\":\"#7f93ff\",\"--border\":\"#1a1a2a\"}" },
                    { 28, "linear-gradient(180deg,#0b0603,#2a1609)", new DateTime(2026, 2, 16, 0, 0, 0, 0, DateTimeKind.Utc), "Ciepłe światła nocy", "🌃", true, true, false, true, "Amber Night", 28, new DateTime(2026, 2, 16, 0, 0, 0, 0, DateTimeKind.Utc), "{\"--bg-primary\":\"#070403\",\"--bg-secondary\":\"#21100b\",\"--bg-card\":\"#31150d\",\"--text-primary\":\"#fff6eb\",\"--text-secondary\":\"#efd9c1\",\"--accent\":\"#ff8f00\",\"--accent-hover\":\"#ffb300\",\"--border\":\"#3b2416\"}" },
                    { 29, "linear-gradient(180deg,#fbfdff,#f2f8ff)", new DateTime(2026, 2, 16, 0, 0, 0, 0, DateTimeKind.Utc), "Subtelne perłowe akcenty", "🩵", true, false, false, true, "Pearl Veil", 29, new DateTime(2026, 2, 16, 0, 0, 0, 0, DateTimeKind.Utc), "{\"--bg-primary\":\"#feffff\",\"--bg-secondary\":\"#f7fbff\",\"--bg-card\":\"#f2f8ff\",\"--text-primary\":\"#11131a\",\"--text-secondary\":\"#6b7280\",\"--accent\":\"#7ab8ff\",\"--accent-hover\":\"#9ad0ff\",\"--border\":\"#e7eef9\"}" },
                    { 30, "linear-gradient(180deg,#150005,#3b0610)", new DateTime(2026, 2, 16, 0, 0, 0, 0, DateTimeKind.Utc), "Koronkowa czerwień", "🩷", true, true, false, true, "Scarlet Lace", 30, new DateTime(2026, 2, 16, 0, 0, 0, 0, DateTimeKind.Utc), "{\"--bg-primary\":\"#0b0305\",\"--bg-secondary\":\"#2a0608\",\"--bg-card\":\"#3a0d10\",\"--text-primary\":\"#fff2f3\",\"--text-secondary\":\"#e6b8bd\",\"--accent\":\"#c21807\",\"--accent-hover\":\"#ff4d3f\",\"--border\":\"#471216\"}" },
                    { 31, "linear-gradient(180deg,#fff8fb,#fff1f6)", new DateTime(2026, 2, 16, 0, 0, 0, 0, DateTimeKind.Utc), "Miękkie, otulające kolory", "🧣", true, false, false, true, "Velour", 31, new DateTime(2026, 2, 16, 0, 0, 0, 0, DateTimeKind.Utc), "{\"--bg-primary\":\"#fff9fb\",\"--bg-secondary\":\"#fff2f6\",\"--bg-card\":\"#fff0f5\",\"--text-primary\":\"#2b1b22\",\"--text-secondary\":\"#7a5966\",\"--accent\":\"#d81b60\",\"--accent-hover\":\"#ff5c93\",\"--border\":\"#f4dce6\"}" },
                    { 32, "linear-gradient(180deg,#fff6f7,#fff0f2)", new DateTime(2026, 2, 16, 0, 0, 0, 0, DateTimeKind.Utc), "Delikatne płatki", "🌷", true, false, false, true, "Silk Rose", 32, new DateTime(2026, 2, 16, 0, 0, 0, 0, DateTimeKind.Utc), "{\"--bg-primary\":\"#fff8f8\",\"--bg-secondary\":\"#fff1f2\",\"--bg-card\":\"#fff0f1\",\"--text-primary\":\"#22111a\",\"--text-secondary\":\"#7a4f5c\",\"--accent\":\"#ff3366\",\"--accent-hover\":\"#ff6b99\",\"--border\":\"#f3d7df\"}" },
                    { 33, "linear-gradient(180deg,#0a0612,#241229)", new DateTime(2026, 2, 16, 0, 0, 0, 0, DateTimeKind.Utc), "Nocne jedwabiste odcienie", "🌌", true, true, false, true, "Twilight Silk", 33, new DateTime(2026, 2, 16, 0, 0, 0, 0, DateTimeKind.Utc), "{\"--bg-primary\":\"#060412\",\"--bg-secondary\":\"#1b0f21\",\"--bg-card\":\"#2b1627\",\"--text-primary\":\"#faf6ff\",\"--text-secondary\":\"#d9c8e6\",\"--accent\":\"#7c4dff\",\"--accent-hover\":\"#a58bff\",\"--border\":\"#3a213a\"}" }
                });

            migrationBuilder.InsertData(
                table: "SystemConfigurations",
                columns: new[] { "Id", "Active", "CaptchaOption", "MaxMicrophonePlayers", "ModifiedAt", "ModifiedByUserId", "ModifiedByUsername", "SessionTimeoutMinutes" },
                values: new object[] { 1, true, 1, 4, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "system", 30 });

            migrationBuilder.CreateIndex(
                name: "IX_AspNetRoleClaims_RoleId",
                table: "AspNetRoleClaims",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "RoleNameIndex",
                table: "AspNetRoles",
                column: "NormalizedName",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUserClaims_UserId",
                table: "AspNetUserClaims",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUserLogins_UserId",
                table: "AspNetUserLogins",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUserRoles_RoleId",
                table: "AspNetUserRoles",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "EmailIndex",
                table: "AspNetUsers",
                column: "NormalizedEmail");

            migrationBuilder.CreateIndex(
                name: "UserNameIndex",
                table: "AspNetUsers",
                column: "NormalizedUserName",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IDX_ExportTask_Project",
                table: "AudioExportTasks",
                column: "ProjectId");

            migrationBuilder.CreateIndex(
                name: "IX_AudioInputMappings_LayerId",
                table: "AudioInputMappings",
                column: "LayerId");

            migrationBuilder.CreateIndex(
                name: "IX_AudioInputMappings_SectionId",
                table: "AudioInputMappings",
                column: "SectionId");

            migrationBuilder.CreateIndex(
                name: "IDX_LayerEffect_Order",
                table: "AudioLayerEffects",
                columns: new[] { "LayerId", "Order" });

            migrationBuilder.CreateIndex(
                name: "IX_AudioLayerEffects_EffectId",
                table: "AudioLayerEffects",
                column: "EffectId");

            migrationBuilder.CreateIndex(
                name: "IX_AudioLayerItems_LayerId",
                table: "AudioLayerItems",
                column: "LayerId");

            migrationBuilder.CreateIndex(
                name: "IX_AudioLayers_AudioClipId",
                table: "AudioLayers",
                column: "AudioClipId");

            migrationBuilder.CreateIndex(
                name: "IX_AudioLayers_InputPresetId",
                table: "AudioLayers",
                column: "InputPresetId");

            migrationBuilder.CreateIndex(
                name: "IX_AudioLayers_SectionId",
                table: "AudioLayers",
                column: "SectionId");

            migrationBuilder.CreateIndex(
                name: "UQ_ProjCollab_Project_User",
                table: "AudioProjectCollaborators",
                columns: new[] { "ProjectId", "UserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AudioSamples_PackId",
                table: "AudioSamples",
                column: "PackId");

            migrationBuilder.CreateIndex(
                name: "IX_AudioSections_ProjectId",
                table: "AudioSections",
                column: "ProjectId");

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogs_UserId",
                table: "AuditLogs",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Bets_MarketId",
                table: "Bets",
                column: "MarketId");

            migrationBuilder.CreateIndex(
                name: "IX_Bets_OptionId",
                table: "Bets",
                column: "OptionId");

            migrationBuilder.CreateIndex(
                name: "IX_BettingMarkets_EventId",
                table: "BettingMarkets",
                column: "EventId");

            migrationBuilder.CreateIndex(
                name: "IX_BettingOptions_MarketId",
                table: "BettingOptions",
                column: "MarketId");

            migrationBuilder.CreateIndex(
                name: "IX_BoardGameCollectionBoardGames_BoardGameId",
                table: "BoardGameCollectionBoardGames",
                column: "BoardGameId");

            migrationBuilder.CreateIndex(
                name: "IX_BoardGameCollectionBoardGames_CollectionId",
                table: "BoardGameCollectionBoardGames",
                column: "CollectionId");

            migrationBuilder.CreateIndex(
                name: "IX_BoardGameCollections_OwnerId",
                table: "BoardGameCollections",
                column: "OwnerId");

            migrationBuilder.CreateIndex(
                name: "IX_BoardGameCollections_ParentId",
                table: "BoardGameCollections",
                column: "ParentId");

            migrationBuilder.CreateIndex(
                name: "IX_BoardGameGenres_Name",
                table: "BoardGameGenres",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_BoardGameGenres_ParentGenreId",
                table: "BoardGameGenres",
                column: "ParentGenreId");

            migrationBuilder.CreateIndex(
                name: "IX_BoardGames_BoardGameGenreId",
                table: "BoardGames",
                column: "BoardGameGenreId");

            migrationBuilder.CreateIndex(
                name: "IX_BoardGames_OwnerId",
                table: "BoardGames",
                column: "OwnerId");

            migrationBuilder.CreateIndex(
                name: "IX_BoardGameSessionRoundPartPlayers_PartId",
                table: "BoardGameSessionRoundPartPlayers",
                column: "PartId");

            migrationBuilder.CreateIndex(
                name: "IX_BoardGameSessionRoundParts_RoundId",
                table: "BoardGameSessionRoundParts",
                column: "RoundId");

            migrationBuilder.CreateIndex(
                name: "IX_BoardGameSessionRounds_SessionId",
                table: "BoardGameSessionRounds",
                column: "SessionId");

            migrationBuilder.CreateIndex(
                name: "IX_BoardGameSessions_EventId",
                table: "BoardGameSessions",
                column: "EventId");

            migrationBuilder.CreateIndex(
                name: "IX_BoardGameTags_BoardGameId_Name",
                table: "BoardGameTags",
                columns: new[] { "BoardGameId", "Name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_BookCollectionBooks_BookId",
                table: "BookCollectionBooks",
                column: "BookId");

            migrationBuilder.CreateIndex(
                name: "IX_BookCollectionBooks_CollectionId",
                table: "BookCollectionBooks",
                column: "CollectionId");

            migrationBuilder.CreateIndex(
                name: "IX_BookCollections_OwnerId",
                table: "BookCollections",
                column: "OwnerId");

            migrationBuilder.CreateIndex(
                name: "IX_BookCollections_ParentId",
                table: "BookCollections",
                column: "ParentId");

            migrationBuilder.CreateIndex(
                name: "IX_Books_BookGenreId",
                table: "Books",
                column: "BookGenreId");

            migrationBuilder.CreateIndex(
                name: "IX_Books_OwnerId",
                table: "Books",
                column: "OwnerId");

            migrationBuilder.CreateIndex(
                name: "IX_BookTags_BookId",
                table: "BookTags",
                column: "BookId");

            migrationBuilder.CreateIndex(
                name: "IX_CampaignPlayers_CampaignId_PlayerId",
                table: "CampaignPlayers",
                columns: new[] { "CampaignId", "PlayerId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CampaignPlayers_PlayerId",
                table: "CampaignPlayers",
                column: "PlayerId");

            migrationBuilder.CreateIndex(
                name: "IX_CampaignRoundProgress_CampaignId_RoundNumber",
                table: "CampaignRoundProgress",
                columns: new[] { "CampaignId", "RoundNumber" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CampaignRoundProgress_ChosenSongId",
                table: "CampaignRoundProgress",
                column: "ChosenSongId");

            migrationBuilder.CreateIndex(
                name: "IX_Campaigns_TemplateId",
                table: "Campaigns",
                column: "TemplateId");

            migrationBuilder.CreateIndex(
                name: "IX_CampaignTemplateRounds_RewardSkillDefinitionId",
                table: "CampaignTemplateRounds",
                column: "RewardSkillDefinitionId");

            migrationBuilder.CreateIndex(
                name: "IX_CampaignTemplateRounds_TemplateId",
                table: "CampaignTemplateRounds",
                column: "TemplateId");

            migrationBuilder.CreateIndex(
                name: "IX_CampaignTemplateRoundSongs_SongId",
                table: "CampaignTemplateRoundSongs",
                column: "SongId");

            migrationBuilder.CreateIndex(
                name: "IX_CampaignTemplateRoundSongs_TemplateRoundId",
                table: "CampaignTemplateRoundSongs",
                column: "TemplateRoundId");

            migrationBuilder.CreateIndex(
                name: "IX_CampaignTemplates_CreatedByPlayerId",
                table: "CampaignTemplates",
                column: "CreatedByPlayerId");

            migrationBuilder.CreateIndex(
                name: "IX_Captchas_UserId",
                table: "Captchas",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_ContactAddresses_ContactId",
                table: "ContactAddresses",
                column: "ContactId");

            migrationBuilder.CreateIndex(
                name: "IX_ContactEmails_ContactId",
                table: "ContactEmails",
                column: "ContactId");

            migrationBuilder.CreateIndex(
                name: "IX_ContactGroupMembers_ContactId",
                table: "ContactGroupMembers",
                column: "ContactId");

            migrationBuilder.CreateIndex(
                name: "IX_ContactGroupMembers_GroupId",
                table: "ContactGroupMembers",
                column: "GroupId");

            migrationBuilder.CreateIndex(
                name: "IX_ContactGroups_OrganizationId",
                table: "ContactGroups",
                column: "OrganizationId");

            migrationBuilder.CreateIndex(
                name: "IX_ContactGroups_OwnerUserId",
                table: "ContactGroups",
                column: "OwnerUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ContactPhones_ContactId",
                table: "ContactPhones",
                column: "ContactId");

            migrationBuilder.CreateIndex(
                name: "IX_Contacts_LinkedUserId",
                table: "Contacts",
                column: "LinkedUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Contacts_OrganizationId",
                table: "Contacts",
                column: "OrganizationId");

            migrationBuilder.CreateIndex(
                name: "IX_Contacts_OwnerUserId_ExternalId",
                table: "Contacts",
                columns: new[] { "OwnerUserId", "ExternalId" },
                unique: true,
                filter: "\"ExternalId\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_DanceStyles_Name",
                table: "DanceStyles",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DmxSceneSteps_SceneId",
                table: "DmxSceneSteps",
                column: "SceneId");

            migrationBuilder.CreateIndex(
                name: "IX_DmxSceneSteps_SequenceId",
                table: "DmxSceneSteps",
                column: "SequenceId");

            migrationBuilder.CreateIndex(
                name: "IDX_Audit_Entity",
                table: "EntityChangeLogs",
                columns: new[] { "EntityName", "EntityId" });

            migrationBuilder.CreateIndex(
                name: "IDX_Audit_Timestamp",
                table: "EntityChangeLogs",
                column: "Timestamp");

            migrationBuilder.CreateIndex(
                name: "IDX_Attraction_Event",
                table: "EventAttractions",
                column: "EventId");

            migrationBuilder.CreateIndex(
                name: "IDX_EventBoardGame_EG",
                table: "EventBoardGames",
                columns: new[] { "EventId", "BoardGameId" });

            migrationBuilder.CreateIndex(
                name: "IX_EventBoardGames_BoardGameId",
                table: "EventBoardGames",
                column: "BoardGameId");

            migrationBuilder.CreateIndex(
                name: "IX_EventComments_EventId",
                table: "EventComments",
                column: "EventId");

            migrationBuilder.CreateIndex(
                name: "IX_EventComments_ParentId",
                table: "EventComments",
                column: "ParentId");

            migrationBuilder.CreateIndex(
                name: "IX_EventDateProposals_EventId",
                table: "EventDateProposals",
                column: "EventId");

            migrationBuilder.CreateIndex(
                name: "IX_EventDateVotes_ProposalId_UserId",
                table: "EventDateVotes",
                columns: new[] { "ProposalId", "UserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IDX_Expense_Event",
                table: "EventExpenses",
                column: "EventId");

            migrationBuilder.CreateIndex(
                name: "IX_EventExpenseShares_ExpenseId",
                table: "EventExpenseShares",
                column: "ExpenseId");

            migrationBuilder.CreateIndex(
                name: "IDX_EventInvite_Event_User",
                table: "EventInvites",
                columns: new[] { "EventId", "ToUserId" });

            migrationBuilder.CreateIndex(
                name: "IDX_Menu_Event",
                table: "EventMenuItems",
                column: "EventId");

            migrationBuilder.CreateIndex(
                name: "IDX_Payment_Event",
                table: "EventPayments",
                column: "EventId");

            migrationBuilder.CreateIndex(
                name: "IDX_Payment_EventUser",
                table: "EventPayments",
                columns: new[] { "EventId", "UserId" });

            migrationBuilder.CreateIndex(
                name: "IX_EventPhotos_EventId",
                table: "EventPhotos",
                column: "EventId");

            migrationBuilder.CreateIndex(
                name: "IX_EventPollOptions_PollId",
                table: "EventPollOptions",
                column: "PollId");

            migrationBuilder.CreateIndex(
                name: "IDX_PollResponse_Respondent",
                table: "EventPollResponses",
                columns: new[] { "PollId", "RespondentEmail" });

            migrationBuilder.CreateIndex(
                name: "IX_EventPollResponses_OptionId",
                table: "EventPollResponses",
                column: "OptionId");

            migrationBuilder.CreateIndex(
                name: "IDX_Poll_Event",
                table: "EventPolls",
                column: "EventId");

            migrationBuilder.CreateIndex(
                name: "UQ_Poll_Token",
                table: "EventPolls",
                column: "Token",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Events_LocationId",
                table: "Events",
                column: "LocationId");

            migrationBuilder.CreateIndex(
                name: "IX_Events_OrganizerId",
                table: "Events",
                column: "OrganizerId");

            migrationBuilder.CreateIndex(
                name: "IX_Events_SeriesParentId",
                table: "Events",
                column: "SeriesParentId");

            migrationBuilder.CreateIndex(
                name: "IDX_Schedule_Event",
                table: "EventScheduleItems",
                column: "EventId");

            migrationBuilder.CreateIndex(
                name: "IX_EventSessionGamePicks_EventId",
                table: "EventSessionGamePicks",
                column: "EventId");

            migrationBuilder.CreateIndex(
                name: "IX_EventSessionGameVotes_PickId_UserId",
                table: "EventSessionGameVotes",
                columns: new[] { "PickId", "UserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_EventSessionSongPicks_EventId",
                table: "EventSessionSongPicks",
                column: "EventId");

            migrationBuilder.CreateIndex(
                name: "IX_EventSessionSongSignups_PickId_UserId",
                table: "EventSessionSongSignups",
                columns: new[] { "PickId", "UserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IDX_EventVideoGame_EG",
                table: "EventVideoGames",
                columns: new[] { "EventId", "VideoGameId" });

            migrationBuilder.CreateIndex(
                name: "IX_EventVideoGames_VideoGameId",
                table: "EventVideoGames",
                column: "VideoGameId");

            migrationBuilder.CreateIndex(
                name: "IX_FantasyTeamPlayers_FantasyTeamId",
                table: "FantasyTeamPlayers",
                column: "FantasyTeamId");

            migrationBuilder.CreateIndex(
                name: "IX_FantasyTeams_LeagueId",
                table: "FantasyTeams",
                column: "LeagueId");

            migrationBuilder.CreateIndex(
                name: "IX_FavoriteSongs_SongId",
                table: "FavoriteSongs",
                column: "SongId");

            migrationBuilder.CreateIndex(
                name: "UQ_FavSong_Player_Song",
                table: "FavoriteSongs",
                columns: new[] { "PlayerId", "SongId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IDX_KPP_Event",
                table: "KaraokeEventPlayers",
                column: "EventId");

            migrationBuilder.CreateIndex(
                name: "IX_KaraokeEventPlayers_PlayerId",
                table: "KaraokeEventPlayers",
                column: "PlayerId");

            migrationBuilder.CreateIndex(
                name: "UQ_KPP_Event_Player",
                table: "KaraokeEventPlayers",
                columns: new[] { "EventId", "PlayerId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_KaraokeEventRounds_EventId",
                table: "KaraokeEventRounds",
                column: "EventId");

            migrationBuilder.CreateIndex(
                name: "IX_KaraokeEventRounds_PlaylistId",
                table: "KaraokeEventRounds",
                column: "PlaylistId");

            migrationBuilder.CreateIndex(
                name: "IX_KaraokeEventRounds_SessionId",
                table: "KaraokeEventRounds",
                column: "SessionId");

            migrationBuilder.CreateIndex(
                name: "IX_KaraokeEventRounds_SongId",
                table: "KaraokeEventRounds",
                column: "SongId");

            migrationBuilder.CreateIndex(
                name: "IX_KaraokePlaylistSong_SongId",
                table: "KaraokePlaylistSong",
                column: "SongId");

            migrationBuilder.CreateIndex(
                name: "IX_KaraokeRoundParts_PlayerId",
                table: "KaraokeRoundParts",
                column: "PlayerId");

            migrationBuilder.CreateIndex(
                name: "IX_KaraokeRoundParts_RoundId",
                table: "KaraokeRoundParts",
                column: "RoundId");

            migrationBuilder.CreateIndex(
                name: "IDX_KRP_Round",
                table: "KaraokeRoundPlayers",
                column: "RoundId");

            migrationBuilder.CreateIndex(
                name: "IDX_KRP_RoundPlayer",
                table: "KaraokeRoundPlayers",
                columns: new[] { "RoundId", "PlayerId" });

            migrationBuilder.CreateIndex(
                name: "IX_KaraokeRoundPlayers_PlayerId",
                table: "KaraokeRoundPlayers",
                column: "PlayerId");

            migrationBuilder.CreateIndex(
                name: "UQ_KRP_Round_Player_Slot",
                table: "KaraokeRoundPlayers",
                columns: new[] { "RoundId", "PlayerId", "Slot" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_KaraokeSessionPlaylist_PlaylistId",
                table: "KaraokeSessionPlaylist",
                column: "PlaylistId");

            migrationBuilder.CreateIndex(
                name: "IDX_Session_Event",
                table: "KaraokeSessions",
                column: "EventId");

            migrationBuilder.CreateIndex(
                name: "IX_KaraokeSessionSongPicks_SessionId",
                table: "KaraokeSessionSongPicks",
                column: "SessionId");

            migrationBuilder.CreateIndex(
                name: "IX_KaraokeSessionSongPicks_SongId",
                table: "KaraokeSessionSongPicks",
                column: "SongId");

            migrationBuilder.CreateIndex(
                name: "IX_KaraokeSessionSongSignups_PickId_PlayerId",
                table: "KaraokeSessionSongSignups",
                columns: new[] { "PickId", "PlayerId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_KaraokeSessionSongSignups_PlayerId",
                table: "KaraokeSessionSongSignups",
                column: "PlayerId");

            migrationBuilder.CreateIndex(
                name: "IX_KaraokeSingingRecording_SingingId",
                table: "KaraokeSingingRecording",
                column: "SingingId");

            migrationBuilder.CreateIndex(
                name: "IX_KaraokeSingings_PlayerId",
                table: "KaraokeSingings",
                column: "PlayerId");

            migrationBuilder.CreateIndex(
                name: "IX_KaraokeSingings_RoundId",
                table: "KaraokeSingings",
                column: "RoundId");

            migrationBuilder.CreateIndex(
                name: "IX_KaraokeSingings_RoundPartId",
                table: "KaraokeSingings",
                column: "RoundPartId");

            migrationBuilder.CreateIndex(
                name: "IX_KaraokeSongFileNote_SongId",
                table: "KaraokeSongFileNote",
                column: "SongId");

            migrationBuilder.CreateIndex(
                name: "IDX_SongQueue_Event",
                table: "KaraokeSongQueueItems",
                column: "EventId");

            migrationBuilder.CreateIndex(
                name: "IX_KaraokeSongQueueItems_RequestedByPlayerId",
                table: "KaraokeSongQueueItems",
                column: "RequestedByPlayerId");

            migrationBuilder.CreateIndex(
                name: "IX_KaraokeSongQueueItems_SongId",
                table: "KaraokeSongQueueItems",
                column: "SongId");

            migrationBuilder.CreateIndex(
                name: "IX_KaraokeSongs_LinkedSongId",
                table: "KaraokeSongs",
                column: "LinkedSongId");

            migrationBuilder.CreateIndex(
                name: "IX_KaraokeTeamPlayers_PlayerId",
                table: "KaraokeTeamPlayers",
                column: "PlayerId");

            migrationBuilder.CreateIndex(
                name: "UQ_KTP_Team_Player",
                table: "KaraokeTeamPlayers",
                columns: new[] { "TeamId", "PlayerId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_KaraokeTeams_CreatedByPlayerId",
                table: "KaraokeTeams",
                column: "CreatedByPlayerId");

            migrationBuilder.CreateIndex(
                name: "IX_KaraokeTeams_KaraokeSessionId",
                table: "KaraokeTeams",
                column: "KaraokeSessionId");

            migrationBuilder.CreateIndex(
                name: "IX_LeagueEvents_EventId",
                table: "LeagueEvents",
                column: "EventId");

            migrationBuilder.CreateIndex(
                name: "IX_LeagueEvents_LeagueId",
                table: "LeagueEvents",
                column: "LeagueId");

            migrationBuilder.CreateIndex(
                name: "IX_LeagueParticipants_LeagueId",
                table: "LeagueParticipants",
                column: "LeagueId");

            migrationBuilder.CreateIndex(
                name: "IX_Leagues_OrganizationId",
                table: "Leagues",
                column: "OrganizationId");

            migrationBuilder.CreateIndex(
                name: "IX_LibraryAlbumArtists_ArtistId",
                table: "LibraryAlbumArtists",
                column: "ArtistId");

            migrationBuilder.CreateIndex(
                name: "IDX_Album_Title",
                table: "LibraryAlbums",
                column: "Title");

            migrationBuilder.CreateIndex(
                name: "IX_LibraryArtistDetails_ArtistId",
                table: "LibraryArtistDetails",
                column: "ArtistId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_LibraryArtistFacts_ArtistId",
                table: "LibraryArtistFacts",
                column: "ArtistId");

            migrationBuilder.CreateIndex(
                name: "IDX_Artist_NormalizedName",
                table: "LibraryArtists",
                column: "NormalizedName");

            migrationBuilder.CreateIndex(
                name: "IX_LibraryAudioFiles_AlbumId",
                table: "LibraryAudioFiles",
                column: "AlbumId");

            migrationBuilder.CreateIndex(
                name: "IX_LibraryAudioFiles_OwnerId_IsPrivate",
                table: "LibraryAudioFiles",
                columns: new[] { "OwnerId", "IsPrivate" });

            migrationBuilder.CreateIndex(
                name: "IX_LibraryAudioFiles_SongId",
                table: "LibraryAudioFiles",
                column: "SongId");

            migrationBuilder.CreateIndex(
                name: "IX_LibraryMediaFiles_AlbumId",
                table: "LibraryMediaFiles",
                column: "AlbumId");

            migrationBuilder.CreateIndex(
                name: "IX_LibraryMediaFiles_SongId",
                table: "LibraryMediaFiles",
                column: "SongId");

            migrationBuilder.CreateIndex(
                name: "IX_LibrarySongDetails_SongId",
                table: "LibrarySongDetails",
                column: "SongId");

            migrationBuilder.CreateIndex(
                name: "IDX_Song_Title",
                table: "LibrarySongs",
                column: "Title");

            migrationBuilder.CreateIndex(
                name: "IX_LibrarySongs_AlbumId",
                table: "LibrarySongs",
                column: "AlbumId");

            migrationBuilder.CreateIndex(
                name: "IX_LibrarySongs_PrimaryArtistId",
                table: "LibrarySongs",
                column: "PrimaryArtistId");

            migrationBuilder.CreateIndex(
                name: "IX_LoginAttempts_UserId",
                table: "LoginAttempts",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_MicrophoneAssignments_UserId_MicrophoneId",
                table: "MicrophoneAssignments",
                columns: new[] { "UserId", "MicrophoneId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MicrophoneAssignments_UserId_Slot",
                table: "MicrophoneAssignments",
                columns: new[] { "UserId", "Slot" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MovieCollectionMovies_CollectionId",
                table: "MovieCollectionMovies",
                column: "CollectionId");

            migrationBuilder.CreateIndex(
                name: "IX_MovieCollectionMovies_MovieId",
                table: "MovieCollectionMovies",
                column: "MovieId");

            migrationBuilder.CreateIndex(
                name: "IX_MovieCollections_OwnerId",
                table: "MovieCollections",
                column: "OwnerId");

            migrationBuilder.CreateIndex(
                name: "IX_MovieCollections_ParentId",
                table: "MovieCollections",
                column: "ParentId");

            migrationBuilder.CreateIndex(
                name: "IX_Movies_MovieGenreId",
                table: "Movies",
                column: "MovieGenreId");

            migrationBuilder.CreateIndex(
                name: "IX_Movies_OwnerId",
                table: "Movies",
                column: "OwnerId");

            migrationBuilder.CreateIndex(
                name: "IX_MovieTags_MovieId",
                table: "MovieTags",
                column: "MovieId");

            migrationBuilder.CreateIndex(
                name: "IX_MusicGenres_Name",
                table: "MusicGenres",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MusicGenres_ParentGenreId",
                table: "MusicGenres",
                column: "ParentGenreId");

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_CreatedAt",
                table: "Notifications",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_UserId_IsRead",
                table: "Notifications",
                columns: new[] { "UserId", "IsRead" });

            migrationBuilder.CreateIndex(
                name: "IX_OneTimePasswords_UserId",
                table: "OneTimePasswords",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_OpenIddictApplications_ClientId",
                table: "OpenIddictApplications",
                column: "ClientId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_OpenIddictAuthorizations_ApplicationId_Status_Subject_Type",
                table: "OpenIddictAuthorizations",
                columns: new[] { "ApplicationId", "Status", "Subject", "Type" });

            migrationBuilder.CreateIndex(
                name: "IX_OpenIddictScopes_Name",
                table: "OpenIddictScopes",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_OpenIddictTokens_ApplicationId_Status_Subject_Type",
                table: "OpenIddictTokens",
                columns: new[] { "ApplicationId", "Status", "Subject", "Type" });

            migrationBuilder.CreateIndex(
                name: "IX_OpenIddictTokens_AuthorizationId",
                table: "OpenIddictTokens",
                column: "AuthorizationId");

            migrationBuilder.CreateIndex(
                name: "IX_OpenIddictTokens_ReferenceId",
                table: "OpenIddictTokens",
                column: "ReferenceId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PasswordHistory_UserProfileId",
                table: "PasswordHistory",
                column: "UserProfileId");

            migrationBuilder.CreateIndex(
                name: "IX_PlayerLinks_SourcePlayerId_TargetPlayerId",
                table: "PlayerLinks",
                columns: new[] { "SourcePlayerId", "TargetPlayerId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PlayerLinks_TargetPlayerId",
                table: "PlayerLinks",
                column: "TargetPlayerId");

            migrationBuilder.CreateIndex(
                name: "IX_PlayerProgress_PlayerId_Category",
                table: "PlayerProgress",
                columns: new[] { "PlayerId", "Category" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PlayerSkills_PlayerId_SkillDefinitionId",
                table: "PlayerSkills",
                columns: new[] { "PlayerId", "SkillDefinitionId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PlayerSkills_SkillDefinitionId",
                table: "PlayerSkills",
                column: "SkillDefinitionId");

            migrationBuilder.CreateIndex(
                name: "IX_PlayerSkills_UnlockedInCampaignId",
                table: "PlayerSkills",
                column: "UnlockedInCampaignId");

            migrationBuilder.CreateIndex(
                name: "IX_PlaylistItems_PlaylistId",
                table: "PlaylistItems",
                column: "PlaylistId");

            migrationBuilder.CreateIndex(
                name: "IX_PlaylistItems_SongId",
                table: "PlaylistItems",
                column: "SongId");

            migrationBuilder.CreateIndex(
                name: "IX_PlaylistLinks_TargetPlaylistId",
                table: "PlaylistLinks",
                column: "TargetPlaylistId");

            migrationBuilder.CreateIndex(
                name: "IX_Playlists_ParentId",
                table: "Playlists",
                column: "ParentId");

            migrationBuilder.CreateIndex(
                name: "IX_SkinThemes_Name",
                table: "SkinThemes",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SkinThemes_SortOrder",
                table: "SkinThemes",
                column: "SortOrder");

            migrationBuilder.CreateIndex(
                name: "IX_SongDanceMatches_DanceStyleId",
                table: "SongDanceMatches",
                column: "DanceStyleId");

            migrationBuilder.CreateIndex(
                name: "IX_SongDanceMatches_SongId_DanceStyleId",
                table: "SongDanceMatches",
                columns: new[] { "SongId", "DanceStyleId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IDX_SoundfontFile_SoundfontId",
                table: "SoundfontFiles",
                column: "SoundfontId");

            migrationBuilder.CreateIndex(
                name: "IDX_Soundfont_Name",
                table: "Soundfonts",
                column: "Name");

            migrationBuilder.CreateIndex(
                name: "IX_SportActivities_OwnerId",
                table: "SportActivities",
                column: "OwnerId");

            migrationBuilder.CreateIndex(
                name: "IX_SportActivities_SportGenreId",
                table: "SportActivities",
                column: "SportGenreId");

            migrationBuilder.CreateIndex(
                name: "IX_SportTags_SportActivityId",
                table: "SportTags",
                column: "SportActivityId");

            migrationBuilder.CreateIndex(
                name: "IX_TvShowCollections_OwnerId",
                table: "TvShowCollections",
                column: "OwnerId");

            migrationBuilder.CreateIndex(
                name: "IX_TvShowCollections_ParentId",
                table: "TvShowCollections",
                column: "ParentId");

            migrationBuilder.CreateIndex(
                name: "IX_TvShowCollectionTvShows_CollectionId",
                table: "TvShowCollectionTvShows",
                column: "CollectionId");

            migrationBuilder.CreateIndex(
                name: "IX_TvShowCollectionTvShows_TvShowId",
                table: "TvShowCollectionTvShows",
                column: "TvShowId");

            migrationBuilder.CreateIndex(
                name: "IX_TvShows_OwnerId",
                table: "TvShows",
                column: "OwnerId");

            migrationBuilder.CreateIndex(
                name: "IX_TvShows_TvShowGenreId",
                table: "TvShows",
                column: "TvShowGenreId");

            migrationBuilder.CreateIndex(
                name: "IX_TvShowTags_TvShowId",
                table: "TvShowTags",
                column: "TvShowId");

            migrationBuilder.CreateIndex(
                name: "IDX_UserBan_User_Active",
                table: "UserBans",
                columns: new[] { "UserId", "IsActive" });

            migrationBuilder.CreateIndex(
                name: "IX_UserDevices_UserId_DeviceId",
                table: "UserDevices",
                columns: new[] { "UserId", "DeviceId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UserExternalAccounts_UserProfileId",
                table: "UserExternalAccounts",
                column: "UserProfileId");

            migrationBuilder.CreateIndex(
                name: "IX_UserMicrophones_UserId_DeviceId",
                table: "UserMicrophones",
                columns: new[] { "UserId", "DeviceId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UserProfilePlayers_ProfileId",
                table: "UserProfilePlayers",
                column: "ProfileId");

            migrationBuilder.CreateIndex(
                name: "IX_UserProfileSettings_UserId",
                table: "UserProfileSettings",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_VideoGameCollections_OwnerId",
                table: "VideoGameCollections",
                column: "OwnerId");

            migrationBuilder.CreateIndex(
                name: "IX_VideoGameCollections_ParentId",
                table: "VideoGameCollections",
                column: "ParentId");

            migrationBuilder.CreateIndex(
                name: "IX_VideoGameCollectionVideoGames_CollectionId",
                table: "VideoGameCollectionVideoGames",
                column: "CollectionId");

            migrationBuilder.CreateIndex(
                name: "IX_VideoGameCollectionVideoGames_VideoGameId",
                table: "VideoGameCollectionVideoGames",
                column: "VideoGameId");

            migrationBuilder.CreateIndex(
                name: "IX_VideoGameGenres_Name",
                table: "VideoGameGenres",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_VideoGameGenres_ParentGenreId",
                table: "VideoGameGenres",
                column: "ParentGenreId");

            migrationBuilder.CreateIndex(
                name: "IX_VideoGames_OwnerId",
                table: "VideoGames",
                column: "OwnerId");

            migrationBuilder.CreateIndex(
                name: "IX_VideoGames_VideoGameGenreId",
                table: "VideoGames",
                column: "VideoGameGenreId");

            migrationBuilder.CreateIndex(
                name: "IX_VideoGameSessionPlayers_SessionId",
                table: "VideoGameSessionPlayers",
                column: "SessionId");

            migrationBuilder.CreateIndex(
                name: "IX_VideoGameSessionRoundPartPlayers_PartId",
                table: "VideoGameSessionRoundPartPlayers",
                column: "PartId");

            migrationBuilder.CreateIndex(
                name: "IX_VideoGameSessionRoundParts_RoundId",
                table: "VideoGameSessionRoundParts",
                column: "RoundId");

            migrationBuilder.CreateIndex(
                name: "IX_VideoGameSessionRounds_SessionId",
                table: "VideoGameSessionRounds",
                column: "SessionId");

            migrationBuilder.CreateIndex(
                name: "IX_VideoGameSessions_EventId",
                table: "VideoGameSessions",
                column: "EventId");

            migrationBuilder.CreateIndex(
                name: "IX_VideoGameSessions_VideoGameId",
                table: "VideoGameSessions",
                column: "VideoGameId");

            migrationBuilder.CreateIndex(
                name: "IX_VirtualWallets_UserId_LeagueId",
                table: "VirtualWallets",
                columns: new[] { "UserId", "LeagueId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_WikiPageRevisions_WikiPageId",
                table: "WikiPageRevisions",
                column: "WikiPageId");

            migrationBuilder.CreateIndex(
                name: "IX_WikiPages_ParentId",
                table: "WikiPages",
                column: "ParentId");

            migrationBuilder.CreateIndex(
                name: "IX_XpTransactions_EarnedAt",
                table: "XpTransactions",
                column: "EarnedAt");

            migrationBuilder.CreateIndex(
                name: "IX_XpTransactions_PlayerId_Category",
                table: "XpTransactions",
                columns: new[] { "PlayerId", "Category" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AbuseReports");

            migrationBuilder.DropTable(
                name: "AdminScoringPresets");

            migrationBuilder.DropTable(
                name: "AspNetRoleClaims");

            migrationBuilder.DropTable(
                name: "AspNetUserClaims");

            migrationBuilder.DropTable(
                name: "AspNetUserLogins");

            migrationBuilder.DropTable(
                name: "AspNetUserRoles");

            migrationBuilder.DropTable(
                name: "AspNetUserTokens");

            migrationBuilder.DropTable(
                name: "AudioClipTags");

            migrationBuilder.DropTable(
                name: "AudioExportTasks");

            migrationBuilder.DropTable(
                name: "AudioInputMappings");

            migrationBuilder.DropTable(
                name: "AudioLayerEffects");

            migrationBuilder.DropTable(
                name: "AudioLayerItems");

            migrationBuilder.DropTable(
                name: "AudioProjectCollaborators");

            migrationBuilder.DropTable(
                name: "AudioSamples");

            migrationBuilder.DropTable(
                name: "AuditLogs");

            migrationBuilder.DropTable(
                name: "Bets");

            migrationBuilder.DropTable(
                name: "BoardGameCollectionBoardGames");

            migrationBuilder.DropTable(
                name: "BoardGameSessionRoundPartPlayers");

            migrationBuilder.DropTable(
                name: "BoardGameTags");

            migrationBuilder.DropTable(
                name: "BookCollectionBooks");

            migrationBuilder.DropTable(
                name: "BookTags");

            migrationBuilder.DropTable(
                name: "CampaignPlayers");

            migrationBuilder.DropTable(
                name: "CampaignRoundProgress");

            migrationBuilder.DropTable(
                name: "CampaignTemplateRoundSongs");

            migrationBuilder.DropTable(
                name: "Captchas");

            migrationBuilder.DropTable(
                name: "ContactAddresses");

            migrationBuilder.DropTable(
                name: "ContactEmails");

            migrationBuilder.DropTable(
                name: "ContactGroupMembers");

            migrationBuilder.DropTable(
                name: "ContactPhones");

            migrationBuilder.DropTable(
                name: "DmxSceneSteps");

            migrationBuilder.DropTable(
                name: "EntityChangeLogs");

            migrationBuilder.DropTable(
                name: "EventAttractions");

            migrationBuilder.DropTable(
                name: "EventBoardGames");

            migrationBuilder.DropTable(
                name: "EventComments");

            migrationBuilder.DropTable(
                name: "EventDateVotes");

            migrationBuilder.DropTable(
                name: "EventExpenseShares");

            migrationBuilder.DropTable(
                name: "EventInvites");

            migrationBuilder.DropTable(
                name: "EventMenuItems");

            migrationBuilder.DropTable(
                name: "EventPayments");

            migrationBuilder.DropTable(
                name: "EventPhotos");

            migrationBuilder.DropTable(
                name: "EventPollResponses");

            migrationBuilder.DropTable(
                name: "EventScheduleItems");

            migrationBuilder.DropTable(
                name: "EventSessionGameVotes");

            migrationBuilder.DropTable(
                name: "EventSessionSongSignups");

            migrationBuilder.DropTable(
                name: "EventVideoGames");

            migrationBuilder.DropTable(
                name: "FantasyTeamPlayers");

            migrationBuilder.DropTable(
                name: "FavoriteSongs");

            migrationBuilder.DropTable(
                name: "HoneyTokens");

            migrationBuilder.DropTable(
                name: "KaraokeEventPlayers");

            migrationBuilder.DropTable(
                name: "KaraokePlaylistSong");

            migrationBuilder.DropTable(
                name: "KaraokeRoundPlayers");

            migrationBuilder.DropTable(
                name: "KaraokeSessionPlaylist");

            migrationBuilder.DropTable(
                name: "KaraokeSessionSongSignups");

            migrationBuilder.DropTable(
                name: "KaraokeSingingRecording");

            migrationBuilder.DropTable(
                name: "KaraokeSongCollaborators");

            migrationBuilder.DropTable(
                name: "KaraokeSongFileHistories");

            migrationBuilder.DropTable(
                name: "KaraokeSongFileNote");

            migrationBuilder.DropTable(
                name: "KaraokeSongQueueItems");

            migrationBuilder.DropTable(
                name: "KaraokeTeamPlayers");

            migrationBuilder.DropTable(
                name: "LeagueEvents");

            migrationBuilder.DropTable(
                name: "LeagueParticipants");

            migrationBuilder.DropTable(
                name: "LibraryAlbumArtists");

            migrationBuilder.DropTable(
                name: "LibraryArtistDetails");

            migrationBuilder.DropTable(
                name: "LibraryArtistFacts");

            migrationBuilder.DropTable(
                name: "LibraryAudioFiles");

            migrationBuilder.DropTable(
                name: "LibraryMediaFiles");

            migrationBuilder.DropTable(
                name: "LibrarySongDetails");

            migrationBuilder.DropTable(
                name: "LoginAttempts");

            migrationBuilder.DropTable(
                name: "MicrophoneAssignments");

            migrationBuilder.DropTable(
                name: "MovieCollectionMovies");

            migrationBuilder.DropTable(
                name: "MovieTags");

            migrationBuilder.DropTable(
                name: "MusicGenres");

            migrationBuilder.DropTable(
                name: "Notifications");

            migrationBuilder.DropTable(
                name: "OneTimePasswords");

            migrationBuilder.DropTable(
                name: "OpenIddictScopes");

            migrationBuilder.DropTable(
                name: "OpenIddictTokens");

            migrationBuilder.DropTable(
                name: "PasswordHistory");

            migrationBuilder.DropTable(
                name: "PasswordRequirements");

            migrationBuilder.DropTable(
                name: "PlayerLinks");

            migrationBuilder.DropTable(
                name: "PlayerProgress");

            migrationBuilder.DropTable(
                name: "PlayerSkills");

            migrationBuilder.DropTable(
                name: "PlaylistItems");

            migrationBuilder.DropTable(
                name: "PlaylistLinks");

            migrationBuilder.DropTable(
                name: "SkinThemes");

            migrationBuilder.DropTable(
                name: "SongDanceMatches");

            migrationBuilder.DropTable(
                name: "SoundfontFiles");

            migrationBuilder.DropTable(
                name: "SportTags");

            migrationBuilder.DropTable(
                name: "SystemConfigurations");

            migrationBuilder.DropTable(
                name: "TvShowCollectionTvShows");

            migrationBuilder.DropTable(
                name: "TvShowTags");

            migrationBuilder.DropTable(
                name: "UserBans");

            migrationBuilder.DropTable(
                name: "UserDevices");

            migrationBuilder.DropTable(
                name: "UserExternalAccounts");

            migrationBuilder.DropTable(
                name: "UserMicrophones");

            migrationBuilder.DropTable(
                name: "UserProfileSettings");

            migrationBuilder.DropTable(
                name: "VideoGameCollectionVideoGames");

            migrationBuilder.DropTable(
                name: "VideoGameSessionPlayers");

            migrationBuilder.DropTable(
                name: "VideoGameSessionRoundPartPlayers");

            migrationBuilder.DropTable(
                name: "VirtualWallets");

            migrationBuilder.DropTable(
                name: "WikiPageRevisions");

            migrationBuilder.DropTable(
                name: "XpTransactions");

            migrationBuilder.DropTable(
                name: "AspNetRoles");

            migrationBuilder.DropTable(
                name: "AudioEffects");

            migrationBuilder.DropTable(
                name: "AudioLayers");

            migrationBuilder.DropTable(
                name: "AudioSamplePacks");

            migrationBuilder.DropTable(
                name: "BettingOptions");

            migrationBuilder.DropTable(
                name: "BoardGameCollections");

            migrationBuilder.DropTable(
                name: "BoardGameSessionRoundParts");

            migrationBuilder.DropTable(
                name: "BookCollections");

            migrationBuilder.DropTable(
                name: "Books");

            migrationBuilder.DropTable(
                name: "CampaignTemplateRounds");

            migrationBuilder.DropTable(
                name: "ContactGroups");

            migrationBuilder.DropTable(
                name: "Contacts");

            migrationBuilder.DropTable(
                name: "DmxSceneSequences");

            migrationBuilder.DropTable(
                name: "DmxScenes");

            migrationBuilder.DropTable(
                name: "BoardGames");

            migrationBuilder.DropTable(
                name: "EventDateProposals");

            migrationBuilder.DropTable(
                name: "EventExpenses");

            migrationBuilder.DropTable(
                name: "EventPollOptions");

            migrationBuilder.DropTable(
                name: "EventSessionGamePicks");

            migrationBuilder.DropTable(
                name: "EventSessionSongPicks");

            migrationBuilder.DropTable(
                name: "FantasyTeams");

            migrationBuilder.DropTable(
                name: "KaraokeSessionSongPicks");

            migrationBuilder.DropTable(
                name: "KaraokeSingings");

            migrationBuilder.DropTable(
                name: "KaraokeTeams");

            migrationBuilder.DropTable(
                name: "MovieCollections");

            migrationBuilder.DropTable(
                name: "Movies");

            migrationBuilder.DropTable(
                name: "OpenIddictAuthorizations");

            migrationBuilder.DropTable(
                name: "Campaigns");

            migrationBuilder.DropTable(
                name: "Playlists");

            migrationBuilder.DropTable(
                name: "DanceStyles");

            migrationBuilder.DropTable(
                name: "Soundfonts");

            migrationBuilder.DropTable(
                name: "SportActivities");

            migrationBuilder.DropTable(
                name: "TvShowCollections");

            migrationBuilder.DropTable(
                name: "TvShows");

            migrationBuilder.DropTable(
                name: "VideoGameCollections");

            migrationBuilder.DropTable(
                name: "VideoGameSessionRoundParts");

            migrationBuilder.DropTable(
                name: "WikiPages");

            migrationBuilder.DropTable(
                name: "AudioClips");

            migrationBuilder.DropTable(
                name: "AudioInputPresets");

            migrationBuilder.DropTable(
                name: "AudioSections");

            migrationBuilder.DropTable(
                name: "BettingMarkets");

            migrationBuilder.DropTable(
                name: "BoardGameSessionRounds");

            migrationBuilder.DropTable(
                name: "BookGenres");

            migrationBuilder.DropTable(
                name: "SkillDefinitions");

            migrationBuilder.DropTable(
                name: "BoardGameGenres");

            migrationBuilder.DropTable(
                name: "EventPolls");

            migrationBuilder.DropTable(
                name: "Leagues");

            migrationBuilder.DropTable(
                name: "KaraokeRoundParts");

            migrationBuilder.DropTable(
                name: "MovieGenres");

            migrationBuilder.DropTable(
                name: "OpenIddictApplications");

            migrationBuilder.DropTable(
                name: "CampaignTemplates");

            migrationBuilder.DropTable(
                name: "SportGenres");

            migrationBuilder.DropTable(
                name: "TvShowGenres");

            migrationBuilder.DropTable(
                name: "VideoGameSessionRounds");

            migrationBuilder.DropTable(
                name: "AudioProjects");

            migrationBuilder.DropTable(
                name: "BoardGameSessions");

            migrationBuilder.DropTable(
                name: "Organizations");

            migrationBuilder.DropTable(
                name: "KaraokeEventRounds");

            migrationBuilder.DropTable(
                name: "VideoGameSessions");

            migrationBuilder.DropTable(
                name: "KaraokePlaylists");

            migrationBuilder.DropTable(
                name: "KaraokeSessions");

            migrationBuilder.DropTable(
                name: "KaraokeSongs");

            migrationBuilder.DropTable(
                name: "VideoGames");

            migrationBuilder.DropTable(
                name: "Events");

            migrationBuilder.DropTable(
                name: "LibrarySongs");

            migrationBuilder.DropTable(
                name: "VideoGameGenres");

            migrationBuilder.DropTable(
                name: "EventLocations");

            migrationBuilder.DropTable(
                name: "UserProfilePlayers");

            migrationBuilder.DropTable(
                name: "LibraryAlbums");

            migrationBuilder.DropTable(
                name: "LibraryArtists");

            migrationBuilder.DropTable(
                name: "AspNetUsers");
        }
    }
}
