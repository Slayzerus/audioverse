using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AudioVerse.API.Migrations
{
    /// <inheritdoc />
    public partial class profilesettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "BreadcrumbsEnabled",
                table: "UserProfileSettings",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "CompletedTutorials",
                table: "UserProfileSettings",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CustomThemes",
                table: "UserProfileSettings",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Difficulty",
                table: "UserProfileSettings",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "GamepadMapping",
                table: "UserProfileSettings",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "KaraokeDisplaySettings",
                table: "UserProfileSettings",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LocalPlaylists",
                table: "UserProfileSettings",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PitchAlgorithm",
                table: "UserProfileSettings",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PlayerKaraokeSettings",
                table: "UserProfileSettings",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BreadcrumbsEnabled",
                table: "UserProfileSettings");

            migrationBuilder.DropColumn(
                name: "CompletedTutorials",
                table: "UserProfileSettings");

            migrationBuilder.DropColumn(
                name: "CustomThemes",
                table: "UserProfileSettings");

            migrationBuilder.DropColumn(
                name: "Difficulty",
                table: "UserProfileSettings");

            migrationBuilder.DropColumn(
                name: "GamepadMapping",
                table: "UserProfileSettings");

            migrationBuilder.DropColumn(
                name: "KaraokeDisplaySettings",
                table: "UserProfileSettings");

            migrationBuilder.DropColumn(
                name: "LocalPlaylists",
                table: "UserProfileSettings");

            migrationBuilder.DropColumn(
                name: "PitchAlgorithm",
                table: "UserProfileSettings");

            migrationBuilder.DropColumn(
                name: "PlayerKaraokeSettings",
                table: "UserProfileSettings");
        }
    }
}
