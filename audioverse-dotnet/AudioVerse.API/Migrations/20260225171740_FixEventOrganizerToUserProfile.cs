using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AudioVerse.API.Migrations
{
    /// <inheritdoc />
    public partial class FixEventOrganizerToUserProfile : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Data fix: convert OrganizerId from UserProfilePlayers.Id → AspNetUsers.Id
            // Must run BEFORE the FK swap.
            migrationBuilder.Sql("""
                UPDATE "Events" e
                SET "OrganizerId" = p."ProfileId"
                FROM "UserProfilePlayers" p
                WHERE e."OrganizerId" = p."Id"
                """);

            migrationBuilder.DropForeignKey(
                name: "FK_Events_UserProfilePlayers_OrganizerId",
                table: "Events");

            migrationBuilder.AddForeignKey(
                name: "FK_Events_AspNetUsers_OrganizerId",
                table: "Events",
                column: "OrganizerId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Events_AspNetUsers_OrganizerId",
                table: "Events");

            migrationBuilder.AddForeignKey(
                name: "FK_Events_UserProfilePlayers_OrganizerId",
                table: "Events",
                column: "OrganizerId",
                principalTable: "UserProfilePlayers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
