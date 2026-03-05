using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace AudioVerse.API.Migrations
{
    /// <inheritdoc />
    public partial class next : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "GoogleBooksLastSyncUtc",
                table: "Books",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BggCategories",
                table: "BoardGames",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BggDesigners",
                table: "BoardGames",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "BggLastSyncUtc",
                table: "BoardGames",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BggMechanics",
                table: "BoardGames",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "BggMinAge",
                table: "BoardGames",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BggPublishers",
                table: "BoardGames",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "BggRank",
                table: "BoardGames",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BggThumbnailUrl",
                table: "BoardGames",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "BggUsersRated",
                table: "BoardGames",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "BggWeight",
                table: "BoardGames",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsFullBggData",
                table: "BoardGames",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "BggSyncStatuses",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    State = table.Column<int>(type: "integer", nullable: false),
                    TotalGames = table.Column<int>(type: "integer", nullable: false),
                    SyncedGames = table.Column<int>(type: "integer", nullable: false),
                    FailedGames = table.Column<int>(type: "integer", nullable: false),
                    LastSyncedBggId = table.Column<int>(type: "integer", nullable: true),
                    StartedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    FinishedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastFullSyncUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ErrorMessage = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BggSyncStatuses", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BggSyncStatuses");

            migrationBuilder.DropColumn(
                name: "GoogleBooksLastSyncUtc",
                table: "Books");

            migrationBuilder.DropColumn(
                name: "BggCategories",
                table: "BoardGames");

            migrationBuilder.DropColumn(
                name: "BggDesigners",
                table: "BoardGames");

            migrationBuilder.DropColumn(
                name: "BggLastSyncUtc",
                table: "BoardGames");

            migrationBuilder.DropColumn(
                name: "BggMechanics",
                table: "BoardGames");

            migrationBuilder.DropColumn(
                name: "BggMinAge",
                table: "BoardGames");

            migrationBuilder.DropColumn(
                name: "BggPublishers",
                table: "BoardGames");

            migrationBuilder.DropColumn(
                name: "BggRank",
                table: "BoardGames");

            migrationBuilder.DropColumn(
                name: "BggThumbnailUrl",
                table: "BoardGames");

            migrationBuilder.DropColumn(
                name: "BggUsersRated",
                table: "BoardGames");

            migrationBuilder.DropColumn(
                name: "BggWeight",
                table: "BoardGames");

            migrationBuilder.DropColumn(
                name: "IsFullBggData",
                table: "BoardGames");
        }
    }
}
