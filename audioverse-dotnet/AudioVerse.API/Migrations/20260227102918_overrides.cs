using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace AudioVerse.API.Migrations
{
    /// <inheritdoc />
    public partial class overrides : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "FeatureVisibilityOverrides",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    SystemConfigurationId = table.Column<int>(type: "integer", nullable: false),
                    FeatureId = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    Hidden = table.Column<bool>(type: "boolean", nullable: false),
                    VisibleToRoles = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FeatureVisibilityOverrides", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FeatureVisibilityOverrides_SystemConfigurations_SystemConfi~",
                        column: x => x.SystemConfigurationId,
                        principalTable: "SystemConfigurations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "UQ_FeatureVisibility_Config_Feature",
                table: "FeatureVisibilityOverrides",
                columns: new[] { "SystemConfigurationId", "FeatureId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "FeatureVisibilityOverrides");
        }
    }
}
