using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NiceToDev.FunZone.API.Migrations
{
    /// <inheritdoc />
    public partial class Init2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "UltrastarNote");

            migrationBuilder.DropColumn(
                name: "SongType",
                table: "KaraokeSongs");

            migrationBuilder.AlterColumn<string>(
                name: "FilePath",
                table: "KaraokeSongs",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Format",
                table: "KaraokeSongs",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "KaraokeNote",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SongId = table.Column<int>(type: "int", nullable: false),
                    NoteLine = table.Column<string>(type: "nvarchar(max)", nullable: false)
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

            migrationBuilder.CreateIndex(
                name: "IX_KaraokeNote_SongId",
                table: "KaraokeNote",
                column: "SongId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "KaraokeNote");

            migrationBuilder.DropColumn(
                name: "Format",
                table: "KaraokeSongs");

            migrationBuilder.AlterColumn<string>(
                name: "FilePath",
                table: "KaraokeSongs",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AddColumn<string>(
                name: "SongType",
                table: "KaraokeSongs",
                type: "nvarchar(21)",
                maxLength: 21,
                nullable: false,
                defaultValue: "");

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

            migrationBuilder.CreateIndex(
                name: "IX_UltrastarNote_SongId",
                table: "UltrastarNote",
                column: "SongId");
        }
    }
}
