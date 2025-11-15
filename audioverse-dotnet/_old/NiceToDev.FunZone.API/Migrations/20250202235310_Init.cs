using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NiceToDev.FunZone.API.Migrations
{
    /// <inheritdoc />
    public partial class Init : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "KaraokePlayers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KaraokePlayers", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "KaraokeSongs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Title = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Artist = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Genre = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Language = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Year = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CoverPath = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    AudioPath = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    VideoPath = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SongType = table.Column<string>(type: "nvarchar(21)", maxLength: 21, nullable: false),
                    FilePath = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KaraokeSongs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "KaraokeParties",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    OrganizerId = table.Column<int>(type: "int", nullable: false),
                    StartTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    EndTime = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KaraokeParties", x => x.Id);
                    table.ForeignKey(
                        name: "FK_KaraokeParties_KaraokePlayers_OrganizerId",
                        column: x => x.OrganizerId,
                        principalTable: "KaraokePlayers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "UltrastarNote",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SongId = table.Column<int>(type: "int", nullable: false),
                    NoteLine = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UltrastarNote", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UltrastarNote_KaraokeSongs_SongId",
                        column: x => x.SongId,
                        principalTable: "KaraokeSongs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "KaraokePartyKaraokePlayer",
                columns: table => new
                {
                    PartiesId = table.Column<int>(type: "int", nullable: false),
                    PlayersId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KaraokePartyKaraokePlayer", x => new { x.PartiesId, x.PlayersId });
                    table.ForeignKey(
                        name: "FK_KaraokePartyKaraokePlayer_KaraokeParties_PartiesId",
                        column: x => x.PartiesId,
                        principalTable: "KaraokeParties",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_KaraokePartyKaraokePlayer_KaraokePlayers_PlayersId",
                        column: x => x.PlayersId,
                        principalTable: "KaraokePlayers",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "KaraokePartyPlayer",
                columns: table => new
                {
                    PartyId = table.Column<int>(type: "int", nullable: false),
                    PlayerId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KaraokePartyPlayer", x => new { x.PartyId, x.PlayerId });
                    table.ForeignKey(
                        name: "FK_KaraokePartyPlayer_KaraokeParties_PartyId",
                        column: x => x.PartyId,
                        principalTable: "KaraokeParties",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_KaraokePartyPlayer_KaraokePlayers_PlayerId",
                        column: x => x.PlayerId,
                        principalTable: "KaraokePlayers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "KaraokePlaylists",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    KaraokePartyId = table.Column<int>(type: "int", nullable: true)
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
                name: "KaraokePartyPlaylist",
                columns: table => new
                {
                    PartyId = table.Column<int>(type: "int", nullable: false),
                    PlaylistId = table.Column<int>(type: "int", nullable: false)
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
                name: "KaraokePartyRound",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PartyId = table.Column<int>(type: "int", nullable: false),
                    PlaylistId = table.Column<int>(type: "int", nullable: false),
                    SongId = table.Column<int>(type: "int", nullable: false),
                    PlayerId = table.Column<int>(type: "int", nullable: false),
                    Number = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KaraokePartyRound", x => x.Id);
                    table.ForeignKey(
                        name: "FK_KaraokePartyRound_KaraokeParties_PartyId",
                        column: x => x.PartyId,
                        principalTable: "KaraokeParties",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_KaraokePartyRound_KaraokePlayers_PlayerId",
                        column: x => x.PlayerId,
                        principalTable: "KaraokePlayers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_KaraokePartyRound_KaraokePlaylists_PlaylistId",
                        column: x => x.PlaylistId,
                        principalTable: "KaraokePlaylists",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_KaraokePartyRound_KaraokeSongs_SongId",
                        column: x => x.SongId,
                        principalTable: "KaraokeSongs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "KaraokePlaylistSong",
                columns: table => new
                {
                    PlaylistId = table.Column<int>(type: "int", nullable: false),
                    SongId = table.Column<int>(type: "int", nullable: false)
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
                name: "KaraokeSinging",
                columns: table => new
                {
                    RoundId = table.Column<int>(type: "int", nullable: false),
                    PlayerId = table.Column<int>(type: "int", nullable: false),
                    Score = table.Column<int>(type: "int", nullable: false),
                    Hits = table.Column<int>(type: "int", nullable: false),
                    Misses = table.Column<int>(type: "int", nullable: false),
                    Good = table.Column<int>(type: "int", nullable: false),
                    Perfect = table.Column<int>(type: "int", nullable: false),
                    Combo = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KaraokeSinging", x => new { x.PlayerId, x.RoundId });
                    table.ForeignKey(
                        name: "FK_KaraokeSinging_KaraokePartyRound_RoundId",
                        column: x => x.RoundId,
                        principalTable: "KaraokePartyRound",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_KaraokeSinging_KaraokePlayers_PlayerId",
                        column: x => x.PlayerId,
                        principalTable: "KaraokePlayers",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "KaraokeRecordings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SingingId = table.Column<int>(type: "int", nullable: false),
                    SingingPlayerId = table.Column<int>(type: "int", nullable: false),
                    SingingRoundId = table.Column<int>(type: "int", nullable: false),
                    FileName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Data = table.Column<byte[]>(type: "varbinary(max)", nullable: false),
                    Type = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KaraokeRecordings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_KaraokeRecordings_KaraokeSinging_SingingPlayerId_SingingRoundId",
                        columns: x => new { x.SingingPlayerId, x.SingingRoundId },
                        principalTable: "KaraokeSinging",
                        principalColumns: new[] { "PlayerId", "RoundId" },
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_KaraokeParties_OrganizerId",
                table: "KaraokeParties",
                column: "OrganizerId");

            migrationBuilder.CreateIndex(
                name: "IX_KaraokePartyKaraokePlayer_PlayersId",
                table: "KaraokePartyKaraokePlayer",
                column: "PlayersId");

            migrationBuilder.CreateIndex(
                name: "IX_KaraokePartyPlayer_PlayerId",
                table: "KaraokePartyPlayer",
                column: "PlayerId");

            migrationBuilder.CreateIndex(
                name: "IX_KaraokePartyPlaylist_PlaylistId",
                table: "KaraokePartyPlaylist",
                column: "PlaylistId");

            migrationBuilder.CreateIndex(
                name: "IX_KaraokePartyRound_PartyId",
                table: "KaraokePartyRound",
                column: "PartyId");

            migrationBuilder.CreateIndex(
                name: "IX_KaraokePartyRound_PlayerId",
                table: "KaraokePartyRound",
                column: "PlayerId");

            migrationBuilder.CreateIndex(
                name: "IX_KaraokePartyRound_PlaylistId",
                table: "KaraokePartyRound",
                column: "PlaylistId");

            migrationBuilder.CreateIndex(
                name: "IX_KaraokePartyRound_SongId",
                table: "KaraokePartyRound",
                column: "SongId");

            migrationBuilder.CreateIndex(
                name: "IX_KaraokePlaylists_KaraokePartyId",
                table: "KaraokePlaylists",
                column: "KaraokePartyId");

            migrationBuilder.CreateIndex(
                name: "IX_KaraokePlaylistSong_SongId",
                table: "KaraokePlaylistSong",
                column: "SongId");

            migrationBuilder.CreateIndex(
                name: "IX_KaraokeRecordings_SingingPlayerId_SingingRoundId",
                table: "KaraokeRecordings",
                columns: new[] { "SingingPlayerId", "SingingRoundId" });

            migrationBuilder.CreateIndex(
                name: "IX_KaraokeSinging_RoundId",
                table: "KaraokeSinging",
                column: "RoundId");

            migrationBuilder.CreateIndex(
                name: "IX_UltrastarNote_SongId",
                table: "UltrastarNote",
                column: "SongId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "KaraokePartyKaraokePlayer");

            migrationBuilder.DropTable(
                name: "KaraokePartyPlayer");

            migrationBuilder.DropTable(
                name: "KaraokePartyPlaylist");

            migrationBuilder.DropTable(
                name: "KaraokePlaylistSong");

            migrationBuilder.DropTable(
                name: "KaraokeRecordings");

            migrationBuilder.DropTable(
                name: "UltrastarNote");

            migrationBuilder.DropTable(
                name: "KaraokeSinging");

            migrationBuilder.DropTable(
                name: "KaraokePartyRound");

            migrationBuilder.DropTable(
                name: "KaraokePlaylists");

            migrationBuilder.DropTable(
                name: "KaraokeSongs");

            migrationBuilder.DropTable(
                name: "KaraokeParties");

            migrationBuilder.DropTable(
                name: "KaraokePlayers");
        }
    }
}
