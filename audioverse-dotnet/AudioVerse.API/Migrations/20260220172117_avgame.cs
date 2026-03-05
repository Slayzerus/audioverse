using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace AudioVerse.API.Migrations
{
    /// <inheritdoc />
    public partial class avgame : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AvGames",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Code = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    IsMiniGame = table.Column<bool>(type: "boolean", nullable: false),
                    VsPlayersMinimum = table.Column<int>(type: "integer", nullable: false),
                    VsPlayersMaximum = table.Column<int>(type: "integer", nullable: false),
                    CoopPlayersMinimum = table.Column<int>(type: "integer", nullable: false),
                    CoopPlayersMaximum = table.Column<int>(type: "integer", nullable: false),
                    Icon = table.Column<string>(type: "text", nullable: true),
                    ImageUrl = table.Column<string>(type: "text", nullable: true),
                    Category = table.Column<int>(type: "integer", nullable: false),
                    Difficulty = table.Column<int>(type: "integer", nullable: false),
                    Complexity = table.Column<int>(type: "integer", nullable: false),
                    RoundTimeSeconds = table.Column<int>(type: "integer", nullable: true),
                    EstimatedDurationMinutes = table.Column<int>(type: "integer", nullable: true),
                    SupportsCoop = table.Column<bool>(type: "boolean", nullable: false),
                    SupportsVs = table.Column<bool>(type: "boolean", nullable: false),
                    SupportsSolo = table.Column<bool>(type: "boolean", nullable: false),
                    IsEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    Tags = table.Column<string>(type: "text", nullable: true),
                    Version = table.Column<string>(type: "text", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AvGames", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "MiniGameSessions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EventId = table.Column<int>(type: "integer", nullable: true),
                    HostPlayerId = table.Column<int>(type: "integer", nullable: true),
                    StartedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    EndedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Title = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MiniGameSessions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MiniGameSessions_Events_EventId",
                        column: x => x.EventId,
                        principalTable: "Events",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_MiniGameSessions_UserProfilePlayers_HostPlayerId",
                        column: x => x.HostPlayerId,
                        principalTable: "UserProfilePlayers",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "AvGameAchievements",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    GameId = table.Column<int>(type: "integer", nullable: false),
                    Code = table.Column<string>(type: "text", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    Icon = table.Column<string>(type: "text", nullable: true),
                    XpReward = table.Column<int>(type: "integer", nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    IsEnabled = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AvGameAchievements", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AvGameAchievements_AvGames_GameId",
                        column: x => x.GameId,
                        principalTable: "AvGames",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AvGameAssets",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    GameId = table.Column<int>(type: "integer", nullable: false),
                    AssetType = table.Column<int>(type: "integer", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Url = table.Column<string>(type: "text", nullable: false),
                    MimeType = table.Column<string>(type: "text", nullable: true),
                    FileSizeBytes = table.Column<long>(type: "bigint", nullable: true),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    UploadedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AvGameAssets", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AvGameAssets_AvGames_GameId",
                        column: x => x.GameId,
                        principalTable: "AvGames",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AvGameConfigurations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    GameId = table.Column<int>(type: "integer", nullable: false),
                    ConfigJson = table.Column<string>(type: "text", nullable: false),
                    ScoringJson = table.Column<string>(type: "text", nullable: true),
                    XpMultiplier = table.Column<double>(type: "double precision", nullable: false),
                    Notes = table.Column<string>(type: "text", nullable: true),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastEditedByUserId = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AvGameConfigurations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AvGameConfigurations_AvGames_GameId",
                        column: x => x.GameId,
                        principalTable: "AvGames",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AvGameModes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    GameId = table.Column<int>(type: "integer", nullable: false),
                    Code = table.Column<string>(type: "text", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    RoundTimeSecondsOverride = table.Column<int>(type: "integer", nullable: true),
                    DefaultSettingsJson = table.Column<string>(type: "text", nullable: true),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    IsEnabled = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AvGameModes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AvGameModes_AvGames_GameId",
                        column: x => x.GameId,
                        principalTable: "AvGames",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AvGameSaves",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    GameId = table.Column<int>(type: "integer", nullable: false),
                    PlayerId = table.Column<int>(type: "integer", nullable: false),
                    SlotName = table.Column<string>(type: "text", nullable: false),
                    DataJson = table.Column<string>(type: "text", nullable: false),
                    MetadataJson = table.Column<string>(type: "text", nullable: true),
                    GameVersion = table.Column<string>(type: "text", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AvGameSaves", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AvGameSaves_AvGames_GameId",
                        column: x => x.GameId,
                        principalTable: "AvGames",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AvGameSaves_UserProfilePlayers_PlayerId",
                        column: x => x.PlayerId,
                        principalTable: "UserProfilePlayers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AvGameSettings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    GameId = table.Column<int>(type: "integer", nullable: false),
                    PlayerId = table.Column<int>(type: "integer", nullable: false),
                    SettingsJson = table.Column<string>(type: "text", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AvGameSettings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AvGameSettings_AvGames_GameId",
                        column: x => x.GameId,
                        principalTable: "AvGames",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AvGameSettings_UserProfilePlayers_PlayerId",
                        column: x => x.PlayerId,
                        principalTable: "UserProfilePlayers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MiniGameRounds",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    SessionId = table.Column<int>(type: "integer", nullable: false),
                    RoundNumber = table.Column<int>(type: "integer", nullable: false),
                    Game = table.Column<string>(type: "text", nullable: false),
                    Mode = table.Column<string>(type: "text", nullable: false),
                    GameId = table.Column<int>(type: "integer", nullable: true),
                    AvGameId = table.Column<int>(type: "integer", nullable: true),
                    GameModeId = table.Column<int>(type: "integer", nullable: true),
                    AvGameModeId = table.Column<int>(type: "integer", nullable: true),
                    SettingsJson = table.Column<string>(type: "text", nullable: true),
                    DurationSeconds = table.Column<int>(type: "integer", nullable: true),
                    StartedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    EndedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MiniGameRounds", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MiniGameRounds_AvGameModes_AvGameModeId",
                        column: x => x.AvGameModeId,
                        principalTable: "AvGameModes",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_MiniGameRounds_AvGames_AvGameId",
                        column: x => x.AvGameId,
                        principalTable: "AvGames",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_MiniGameRounds_MiniGameSessions_SessionId",
                        column: x => x.SessionId,
                        principalTable: "MiniGameSessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MiniGameRoundPlayers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    RoundId = table.Column<int>(type: "integer", nullable: false),
                    PlayerId = table.Column<int>(type: "integer", nullable: false),
                    Score = table.Column<int>(type: "integer", nullable: false),
                    Placement = table.Column<int>(type: "integer", nullable: true),
                    IsPersonalBest = table.Column<bool>(type: "boolean", nullable: false),
                    XpEarned = table.Column<int>(type: "integer", nullable: false),
                    ResultDetailsJson = table.Column<string>(type: "text", nullable: true),
                    CompletedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MiniGameRoundPlayers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MiniGameRoundPlayers_MiniGameRounds_RoundId",
                        column: x => x.RoundId,
                        principalTable: "MiniGameRounds",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MiniGameRoundPlayers_UserProfilePlayers_PlayerId",
                        column: x => x.PlayerId,
                        principalTable: "UserProfilePlayers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AvGameAchievements_GameId",
                table: "AvGameAchievements",
                column: "GameId");

            migrationBuilder.CreateIndex(
                name: "IX_AvGameAssets_GameId",
                table: "AvGameAssets",
                column: "GameId");

            migrationBuilder.CreateIndex(
                name: "IX_AvGameConfigurations_GameId",
                table: "AvGameConfigurations",
                column: "GameId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AvGameModes_GameId",
                table: "AvGameModes",
                column: "GameId");

            migrationBuilder.CreateIndex(
                name: "IX_AvGameSaves_GameId",
                table: "AvGameSaves",
                column: "GameId");

            migrationBuilder.CreateIndex(
                name: "IX_AvGameSaves_PlayerId",
                table: "AvGameSaves",
                column: "PlayerId");

            migrationBuilder.CreateIndex(
                name: "IX_AvGameSettings_GameId",
                table: "AvGameSettings",
                column: "GameId");

            migrationBuilder.CreateIndex(
                name: "IX_AvGameSettings_PlayerId",
                table: "AvGameSettings",
                column: "PlayerId");

            migrationBuilder.CreateIndex(
                name: "IX_MiniGameRoundPlayers_PlayerId",
                table: "MiniGameRoundPlayers",
                column: "PlayerId");

            migrationBuilder.CreateIndex(
                name: "IX_MiniGameRoundPlayers_RoundId",
                table: "MiniGameRoundPlayers",
                column: "RoundId");

            migrationBuilder.CreateIndex(
                name: "IX_MiniGameRounds_AvGameId",
                table: "MiniGameRounds",
                column: "AvGameId");

            migrationBuilder.CreateIndex(
                name: "IX_MiniGameRounds_AvGameModeId",
                table: "MiniGameRounds",
                column: "AvGameModeId");

            migrationBuilder.CreateIndex(
                name: "IX_MiniGameRounds_SessionId",
                table: "MiniGameRounds",
                column: "SessionId");

            migrationBuilder.CreateIndex(
                name: "IX_MiniGameSessions_EventId",
                table: "MiniGameSessions",
                column: "EventId");

            migrationBuilder.CreateIndex(
                name: "IX_MiniGameSessions_HostPlayerId",
                table: "MiniGameSessions",
                column: "HostPlayerId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AvGameAchievements");

            migrationBuilder.DropTable(
                name: "AvGameAssets");

            migrationBuilder.DropTable(
                name: "AvGameConfigurations");

            migrationBuilder.DropTable(
                name: "AvGameSaves");

            migrationBuilder.DropTable(
                name: "AvGameSettings");

            migrationBuilder.DropTable(
                name: "MiniGameRoundPlayers");

            migrationBuilder.DropTable(
                name: "MiniGameRounds");

            migrationBuilder.DropTable(
                name: "AvGameModes");

            migrationBuilder.DropTable(
                name: "MiniGameSessions");

            migrationBuilder.DropTable(
                name: "AvGames");
        }
    }
}
