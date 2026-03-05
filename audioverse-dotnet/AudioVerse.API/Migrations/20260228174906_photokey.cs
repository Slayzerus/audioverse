using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace AudioVerse.API.Migrations
{
    /// <inheritdoc />
    public partial class photokey : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_KaraokeRoundParts_UserProfilePlayers_PlayerId",
                table: "KaraokeRoundParts");

            migrationBuilder.DropIndex(
                name: "IX_KaraokeRoundParts_PlayerId",
                table: "KaraokeRoundParts");

            migrationBuilder.DropColumn(
                name: "PlayerId",
                table: "KaraokeRoundParts");

            migrationBuilder.AddColumn<string>(
                name: "PhotoKey",
                table: "AspNetUsers",
                type: "text",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "KaraokeRoundPartPlayers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    RoundPartId = table.Column<int>(type: "integer", nullable: false),
                    PlayerId = table.Column<int>(type: "integer", nullable: false),
                    Slot = table.Column<int>(type: "integer", nullable: false),
                    JoinedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KaraokeRoundPartPlayers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_KaraokeRoundPartPlayers_KaraokeRoundParts_RoundPartId",
                        column: x => x.RoundPartId,
                        principalTable: "KaraokeRoundParts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_KaraokeRoundPartPlayers_UserProfilePlayers_PlayerId",
                        column: x => x.PlayerId,
                        principalTable: "UserProfilePlayers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_KaraokeRoundPartPlayers_PlayerId",
                table: "KaraokeRoundPartPlayers",
                column: "PlayerId");

            migrationBuilder.CreateIndex(
                name: "IX_KaraokeRoundPartPlayers_RoundPartId",
                table: "KaraokeRoundPartPlayers",
                column: "RoundPartId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "KaraokeRoundPartPlayers");

            migrationBuilder.DropColumn(
                name: "PhotoKey",
                table: "AspNetUsers");

            migrationBuilder.AddColumn<int>(
                name: "PlayerId",
                table: "KaraokeRoundParts",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_KaraokeRoundParts_PlayerId",
                table: "KaraokeRoundParts",
                column: "PlayerId");

            migrationBuilder.AddForeignKey(
                name: "FK_KaraokeRoundParts_UserProfilePlayers_PlayerId",
                table: "KaraokeRoundParts",
                column: "PlayerId",
                principalTable: "UserProfilePlayers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
