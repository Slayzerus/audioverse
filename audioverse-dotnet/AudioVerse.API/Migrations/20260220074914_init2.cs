using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace AudioVerse.API.Migrations
{
    /// <inheritdoc />
    public partial class init2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "GlobalMaxListenersPerStation",
                table: "SystemConfigurations",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "GlobalMaxTotalListeners",
                table: "SystemConfigurations",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "DurationMs",
                table: "PlaylistItems",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ExternalId",
                table: "PlaylistItems",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ExternalProvider",
                table: "PlaylistItems",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "BroadcastSessions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    RadioStationId = table.Column<int>(type: "integer", nullable: false),
                    StartUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    EndUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsRunning = table.Column<bool>(type: "boolean", nullable: false),
                    PlaylistId = table.Column<int>(type: "integer", nullable: true),
                    CreatedById = table.Column<int>(type: "integer", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BroadcastSessions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "RadioListeners",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    RadioStationId = table.Column<int>(type: "integer", nullable: false),
                    BroadcastSessionId = table.Column<int>(type: "integer", nullable: true),
                    UserId = table.Column<int>(type: "integer", nullable: true),
                    ConnectionId = table.Column<string>(type: "text", nullable: true),
                    ClientInfo = table.Column<string>(type: "text", nullable: true),
                    RemoteIp = table.Column<string>(type: "text", nullable: true),
                    ConnectedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DisconnectedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RadioListeners", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "RadioPlayStats",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    RadioStationId = table.Column<int>(type: "integer", nullable: false),
                    BroadcastSessionId = table.Column<int>(type: "integer", nullable: true),
                    AudioFileId = table.Column<int>(type: "integer", nullable: true),
                    UserId = table.Column<int>(type: "integer", nullable: true),
                    EventType = table.Column<int>(type: "integer", nullable: false),
                    PositionSeconds = table.Column<double>(type: "double precision", nullable: true),
                    TimestampUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Extra = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RadioPlayStats", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "RadioStations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Slug = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    MaxListeners = table.Column<int>(type: "integer", nullable: true),
                    DefaultPlaylistId = table.Column<int>(type: "integer", nullable: true),
                    IsPublic = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RadioStations", x => x.Id);
                });

            migrationBuilder.UpdateData(
                table: "SystemConfigurations",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "GlobalMaxListenersPerStation", "GlobalMaxTotalListeners" },
                values: new object[] { null, null });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BroadcastSessions");

            migrationBuilder.DropTable(
                name: "RadioListeners");

            migrationBuilder.DropTable(
                name: "RadioPlayStats");

            migrationBuilder.DropTable(
                name: "RadioStations");

            migrationBuilder.DropColumn(
                name: "GlobalMaxListenersPerStation",
                table: "SystemConfigurations");

            migrationBuilder.DropColumn(
                name: "GlobalMaxTotalListeners",
                table: "SystemConfigurations");

            migrationBuilder.DropColumn(
                name: "DurationMs",
                table: "PlaylistItems");

            migrationBuilder.DropColumn(
                name: "ExternalId",
                table: "PlaylistItems");

            migrationBuilder.DropColumn(
                name: "ExternalProvider",
                table: "PlaylistItems");
        }
    }
}
