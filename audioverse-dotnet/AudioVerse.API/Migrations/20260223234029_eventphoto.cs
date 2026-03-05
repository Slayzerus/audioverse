using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AudioVerse.API.Migrations
{
    /// <inheritdoc />
    public partial class eventphoto : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "FiltersJson",
                table: "EventPhotos",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "OriginalId",
                table: "EventPhotos",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_EventPhotos_OriginalId",
                table: "EventPhotos",
                column: "OriginalId");

            migrationBuilder.AddForeignKey(
                name: "FK_EventPhotos_EventPhotos_OriginalId",
                table: "EventPhotos",
                column: "OriginalId",
                principalTable: "EventPhotos",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_EventPhotos_EventPhotos_OriginalId",
                table: "EventPhotos");

            migrationBuilder.DropIndex(
                name: "IX_EventPhotos_OriginalId",
                table: "EventPhotos");

            migrationBuilder.DropColumn(
                name: "FiltersJson",
                table: "EventPhotos");

            migrationBuilder.DropColumn(
                name: "OriginalId",
                table: "EventPhotos");
        }
    }
}
