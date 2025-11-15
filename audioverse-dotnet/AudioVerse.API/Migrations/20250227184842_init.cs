using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace AudioVerse.API.Migrations
{
    /// <inheritdoc />
    public partial class init : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AudioClips",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserProfileId = table.Column<int>(type: "integer", nullable: true),
                    FileName = table.Column<string>(type: "text", nullable: false),
                    FileFormat = table.Column<string>(type: "text", nullable: false),
                    Data = table.Column<byte[]>(type: "bytea", nullable: false),
                    Duration = table.Column<TimeSpan>(type: "interval", nullable: false),
                    Size = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AudioClips", x => x.Id);
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
                name: "KaraokeSongs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Title = table.Column<string>(type: "text", nullable: false),
                    Artist = table.Column<string>(type: "text", nullable: false),
                    Genre = table.Column<string>(type: "text", nullable: false),
                    Language = table.Column<string>(type: "text", nullable: false),
                    Year = table.Column<string>(type: "text", nullable: false),
                    CoverPath = table.Column<string>(type: "text", nullable: false),
                    AudioPath = table.Column<string>(type: "text", nullable: false),
                    VideoPath = table.Column<string>(type: "text", nullable: false),
                    Format = table.Column<int>(type: "integer", nullable: false),
                    FilePath = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KaraokeSongs", x => x.Id);
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
                name: "RoleClaims",
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
                    table.PrimaryKey("PK_RoleClaims", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Roles",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "text", nullable: true),
                    NormalizedName = table.Column<string>(type: "text", nullable: true),
                    ConcurrencyStamp = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Roles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "UserClaims",
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
                    table.PrimaryKey("PK_UserClaims", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "UserLogins",
                columns: table => new
                {
                    LoginProvider = table.Column<string>(type: "text", nullable: false),
                    ProviderKey = table.Column<string>(type: "text", nullable: false),
                    ProviderDisplayName = table.Column<string>(type: "text", nullable: true),
                    UserId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserLogins", x => new { x.LoginProvider, x.ProviderKey });
                });

            migrationBuilder.CreateTable(
                name: "UserProfile",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    RefreshToken = table.Column<string>(type: "text", nullable: false),
                    RefreshTokenExpiryTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UserName = table.Column<string>(type: "text", nullable: true),
                    NormalizedUserName = table.Column<string>(type: "text", nullable: true),
                    Email = table.Column<string>(type: "text", nullable: true),
                    NormalizedEmail = table.Column<string>(type: "text", nullable: true),
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
                    table.PrimaryKey("PK_UserProfile", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "UserRoles",
                columns: table => new
                {
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    RoleId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserRoles", x => new { x.UserId, x.RoleId });
                });

            migrationBuilder.CreateTable(
                name: "UserTokens",
                columns: table => new
                {
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    LoginProvider = table.Column<string>(type: "text", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Value = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserTokens", x => new { x.UserId, x.LoginProvider, x.Name });
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
                name: "KaraokeNote",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    SongId = table.Column<int>(type: "integer", nullable: false),
                    NoteLine = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KaraokeNote", x => x.Id);
                    table.ForeignKey(
                        name: "FK_KaraokeNote_KaraokeSongs_SongId",
                        column: x => x.SongId,
                        principalTable: "KaraokeSongs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
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
                name: "UserProfilePlayers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "text", nullable: false),
                    ProfileId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserProfilePlayers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserProfilePlayers_UserProfile_ProfileId",
                        column: x => x.ProfileId,
                        principalTable: "UserProfile",
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
                    Type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true)
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
                name: "KaraokeParties",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: false),
                    OrganizerId = table.Column<int>(type: "integer", nullable: false),
                    StartTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    EndTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KaraokeParties", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "KaraokePlayers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    KaraokePartyId = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KaraokePlayers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_KaraokePlayers_KaraokeParties_KaraokePartyId",
                        column: x => x.KaraokePartyId,
                        principalTable: "KaraokeParties",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "KaraokePlaylists",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "text", nullable: false),
                    KaraokePartyId = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KaraokePlaylists", x => x.Id);
                    table.ForeignKey(
                        name: "FK_KaraokePlaylists_KaraokeParties_KaraokePartyId",
                        column: x => x.KaraokePartyId,
                        principalTable: "KaraokeParties",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "KaraokePartyPlayers",
                columns: table => new
                {
                    PartyId = table.Column<int>(type: "integer", nullable: false),
                    PlayerId = table.Column<int>(type: "integer", nullable: false),
                    KaraokePlayerId = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KaraokePartyPlayers", x => new { x.PartyId, x.PlayerId });
                    table.ForeignKey(
                        name: "FK_KaraokePartyPlayers_KaraokeParties_PartyId",
                        column: x => x.PartyId,
                        principalTable: "KaraokeParties",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_KaraokePartyPlayers_KaraokePlayers_KaraokePlayerId",
                        column: x => x.KaraokePlayerId,
                        principalTable: "KaraokePlayers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_KaraokePartyPlayers_KaraokePlayers_PlayerId",
                        column: x => x.PlayerId,
                        principalTable: "KaraokePlayers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "KaraokePartyPlaylist",
                columns: table => new
                {
                    PartyId = table.Column<int>(type: "integer", nullable: false),
                    PlaylistId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KaraokePartyPlaylist", x => new { x.PartyId, x.PlaylistId });
                    table.ForeignKey(
                        name: "FK_KaraokePartyPlaylist_KaraokeParties_PartyId",
                        column: x => x.PartyId,
                        principalTable: "KaraokeParties",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_KaraokePartyPlaylist_KaraokePlaylists_PlaylistId",
                        column: x => x.PlaylistId,
                        principalTable: "KaraokePlaylists",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "KaraokePartyRounds",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    PartyId = table.Column<int>(type: "integer", nullable: false),
                    PlaylistId = table.Column<int>(type: "integer", nullable: false),
                    SongId = table.Column<int>(type: "integer", nullable: false),
                    PlayerId = table.Column<int>(type: "integer", nullable: false),
                    Number = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KaraokePartyRounds", x => x.Id);
                    table.ForeignKey(
                        name: "FK_KaraokePartyRounds_KaraokeParties_PartyId",
                        column: x => x.PartyId,
                        principalTable: "KaraokeParties",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_KaraokePartyRounds_KaraokePlayers_PlayerId",
                        column: x => x.PlayerId,
                        principalTable: "KaraokePlayers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_KaraokePartyRounds_KaraokePlaylists_PlaylistId",
                        column: x => x.PlaylistId,
                        principalTable: "KaraokePlaylists",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_KaraokePartyRounds_KaraokeSongs_SongId",
                        column: x => x.SongId,
                        principalTable: "KaraokeSongs",
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
                name: "KaraokeSingings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    RoundId = table.Column<int>(type: "integer", nullable: false),
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
                        name: "FK_KaraokeSingings_KaraokePartyRounds_RoundId",
                        column: x => x.RoundId,
                        principalTable: "KaraokePartyRounds",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_KaraokeSingings_KaraokePlayers_PlayerId",
                        column: x => x.PlayerId,
                        principalTable: "KaraokePlayers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
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

            migrationBuilder.CreateIndex(
                name: "IX_AudioInputMappings_LayerId",
                table: "AudioInputMappings",
                column: "LayerId");

            migrationBuilder.CreateIndex(
                name: "IX_AudioInputMappings_SectionId",
                table: "AudioInputMappings",
                column: "SectionId");

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
                name: "IX_AudioSections_ProjectId",
                table: "AudioSections",
                column: "ProjectId");

            migrationBuilder.CreateIndex(
                name: "IX_KaraokeNote_SongId",
                table: "KaraokeNote",
                column: "SongId");

            migrationBuilder.CreateIndex(
                name: "IX_KaraokeParties_OrganizerId",
                table: "KaraokeParties",
                column: "OrganizerId");

            migrationBuilder.CreateIndex(
                name: "IX_KaraokePartyPlayers_KaraokePlayerId",
                table: "KaraokePartyPlayers",
                column: "KaraokePlayerId");

            migrationBuilder.CreateIndex(
                name: "IX_KaraokePartyPlayers_PlayerId",
                table: "KaraokePartyPlayers",
                column: "PlayerId");

            migrationBuilder.CreateIndex(
                name: "IX_KaraokePartyPlaylist_PlaylistId",
                table: "KaraokePartyPlaylist",
                column: "PlaylistId");

            migrationBuilder.CreateIndex(
                name: "IX_KaraokePartyRounds_PartyId",
                table: "KaraokePartyRounds",
                column: "PartyId");

            migrationBuilder.CreateIndex(
                name: "IX_KaraokePartyRounds_PlayerId",
                table: "KaraokePartyRounds",
                column: "PlayerId");

            migrationBuilder.CreateIndex(
                name: "IX_KaraokePartyRounds_PlaylistId",
                table: "KaraokePartyRounds",
                column: "PlaylistId");

            migrationBuilder.CreateIndex(
                name: "IX_KaraokePartyRounds_SongId",
                table: "KaraokePartyRounds",
                column: "SongId");

            migrationBuilder.CreateIndex(
                name: "IX_KaraokePlayers_KaraokePartyId",
                table: "KaraokePlayers",
                column: "KaraokePartyId");

            migrationBuilder.CreateIndex(
                name: "IX_KaraokePlaylists_KaraokePartyId",
                table: "KaraokePlaylists",
                column: "KaraokePartyId");

            migrationBuilder.CreateIndex(
                name: "IX_KaraokePlaylistSong_SongId",
                table: "KaraokePlaylistSong",
                column: "SongId");

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
                name: "IX_UserProfilePlayers_ProfileId",
                table: "UserProfilePlayers",
                column: "ProfileId");

            migrationBuilder.AddForeignKey(
                name: "FK_KaraokeParties_KaraokePlayers_OrganizerId",
                table: "KaraokeParties",
                column: "OrganizerId",
                principalTable: "KaraokePlayers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_KaraokeParties_KaraokePlayers_OrganizerId",
                table: "KaraokeParties");

            migrationBuilder.DropTable(
                name: "AudioClipTags");

            migrationBuilder.DropTable(
                name: "AudioInputMappings");

            migrationBuilder.DropTable(
                name: "AudioLayerItems");

            migrationBuilder.DropTable(
                name: "KaraokeNote");

            migrationBuilder.DropTable(
                name: "KaraokePartyPlayers");

            migrationBuilder.DropTable(
                name: "KaraokePartyPlaylist");

            migrationBuilder.DropTable(
                name: "KaraokePlaylistSong");

            migrationBuilder.DropTable(
                name: "KaraokeSingingRecording");

            migrationBuilder.DropTable(
                name: "OpenIddictScopes");

            migrationBuilder.DropTable(
                name: "OpenIddictTokens");

            migrationBuilder.DropTable(
                name: "RoleClaims");

            migrationBuilder.DropTable(
                name: "Roles");

            migrationBuilder.DropTable(
                name: "UserClaims");

            migrationBuilder.DropTable(
                name: "UserLogins");

            migrationBuilder.DropTable(
                name: "UserProfilePlayers");

            migrationBuilder.DropTable(
                name: "UserRoles");

            migrationBuilder.DropTable(
                name: "UserTokens");

            migrationBuilder.DropTable(
                name: "AudioLayers");

            migrationBuilder.DropTable(
                name: "KaraokeSingings");

            migrationBuilder.DropTable(
                name: "OpenIddictAuthorizations");

            migrationBuilder.DropTable(
                name: "UserProfile");

            migrationBuilder.DropTable(
                name: "AudioClips");

            migrationBuilder.DropTable(
                name: "AudioInputPresets");

            migrationBuilder.DropTable(
                name: "AudioSections");

            migrationBuilder.DropTable(
                name: "KaraokePartyRounds");

            migrationBuilder.DropTable(
                name: "OpenIddictApplications");

            migrationBuilder.DropTable(
                name: "AudioProjects");

            migrationBuilder.DropTable(
                name: "KaraokePlaylists");

            migrationBuilder.DropTable(
                name: "KaraokeSongs");

            migrationBuilder.DropTable(
                name: "KaraokePlayers");

            migrationBuilder.DropTable(
                name: "KaraokeParties");
        }
    }
}
