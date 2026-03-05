using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace AudioVerse.API.Migrations
{
    /// <inheritdoc />
    public partial class AddEventLists : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "AccessLevel",
                table: "VideoGameCollections",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "VideoGameCollections",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsWishlist",
                table: "VideoGameCollections",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "AccessLevel",
                table: "TvShowCollections",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "TvShowCollections",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsWishlist",
                table: "TvShowCollections",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "AccessLevel",
                table: "MovieCollections",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "MovieCollections",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsWishlist",
                table: "MovieCollections",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "AccessLevel",
                table: "BookCollections",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "BookCollections",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsWishlist",
                table: "BookCollections",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "AccessLevel",
                table: "BoardGameCollections",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "BoardGameCollections",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsWishlist",
                table: "BoardGameCollections",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "EventLists",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    Type = table.Column<int>(type: "integer", nullable: false),
                    Visibility = table.Column<int>(type: "integer", nullable: false),
                    OwnerUserId = table.Column<int>(type: "integer", nullable: true),
                    OrganizationId = table.Column<int>(type: "integer", nullable: true),
                    LeagueId = table.Column<int>(type: "integer", nullable: true),
                    ShareToken = table.Column<string>(type: "text", nullable: false),
                    IconKey = table.Column<string>(type: "text", nullable: true),
                    Color = table.Column<string>(type: "text", nullable: true),
                    IsPinned = table.Column<bool>(type: "boolean", nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EventLists", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EventLists_Leagues_LeagueId",
                        column: x => x.LeagueId,
                        principalTable: "Leagues",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_EventLists_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "EventListItems",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EventListId = table.Column<int>(type: "integer", nullable: false),
                    EventId = table.Column<int>(type: "integer", nullable: false),
                    Note = table.Column<string>(type: "text", nullable: true),
                    Tags = table.Column<string>(type: "text", nullable: true),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    AddedByUserId = table.Column<int>(type: "integer", nullable: true),
                    AddedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EventListItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EventListItems_EventLists_EventListId",
                        column: x => x.EventListId,
                        principalTable: "EventLists",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_EventListItems_Events_EventId",
                        column: x => x.EventId,
                        principalTable: "Events",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_EventListItems_EventId",
                table: "EventListItems",
                column: "EventId");

            migrationBuilder.CreateIndex(
                name: "IX_EventListItems_EventListId",
                table: "EventListItems",
                column: "EventListId");

            migrationBuilder.CreateIndex(
                name: "IX_EventLists_LeagueId",
                table: "EventLists",
                column: "LeagueId");

            migrationBuilder.CreateIndex(
                name: "IX_EventLists_OrganizationId",
                table: "EventLists",
                column: "OrganizationId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "EventListItems");

            migrationBuilder.DropTable(
                name: "EventLists");

            migrationBuilder.DropColumn(
                name: "AccessLevel",
                table: "VideoGameCollections");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "VideoGameCollections");

            migrationBuilder.DropColumn(
                name: "IsWishlist",
                table: "VideoGameCollections");

            migrationBuilder.DropColumn(
                name: "AccessLevel",
                table: "TvShowCollections");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "TvShowCollections");

            migrationBuilder.DropColumn(
                name: "IsWishlist",
                table: "TvShowCollections");

            migrationBuilder.DropColumn(
                name: "AccessLevel",
                table: "MovieCollections");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "MovieCollections");

            migrationBuilder.DropColumn(
                name: "IsWishlist",
                table: "MovieCollections");

            migrationBuilder.DropColumn(
                name: "AccessLevel",
                table: "BookCollections");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "BookCollections");

            migrationBuilder.DropColumn(
                name: "IsWishlist",
                table: "BookCollections");

            migrationBuilder.DropColumn(
                name: "AccessLevel",
                table: "BoardGameCollections");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "BoardGameCollections");

            migrationBuilder.DropColumn(
                name: "IsWishlist",
                table: "BoardGameCollections");
        }
    }
}
