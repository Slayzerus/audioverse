using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace AudioVerse.API.Migrations
{
    /// <inheritdoc />
    public partial class AddLaboratoryExperiments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "LaboratoryExperiments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ExperimentGuid = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false),
                    Operator = table.Column<string>(type: "text", nullable: true),
                    ExecutedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    BenchmarkRuns = table.Column<int>(type: "integer", nullable: false),
                    FileCount = table.Column<int>(type: "integer", nullable: false),
                    ApiVersion = table.Column<string>(type: "text", nullable: true),
                    CrepeAvgRmseCents = table.Column<double>(type: "double precision", nullable: true),
                    CrepeAvgAccuracy50c = table.Column<double>(type: "double precision", nullable: true),
                    CrepeAvgPearsonR = table.Column<double>(type: "double precision", nullable: true),
                    CrepeAvgLatencyMs = table.Column<double>(type: "double precision", nullable: true),
                    PyinAvgRmseCents = table.Column<double>(type: "double precision", nullable: true),
                    PyinAvgAccuracy50c = table.Column<double>(type: "double precision", nullable: true),
                    PyinAvgPearsonR = table.Column<double>(type: "double precision", nullable: true),
                    PyinAvgLatencyMs = table.Column<double>(type: "double precision", nullable: true),
                    SeparationAvgDeltaRmseCents = table.Column<double>(type: "double precision", nullable: true),
                    DtwScore = table.Column<double>(type: "double precision", nullable: true),
                    ResultsJson = table.Column<string>(type: "text", nullable: true),
                    Notes = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LaboratoryExperiments", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "LaboratoryExperimentSamples",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ExperimentId = table.Column<int>(type: "integer", nullable: false),
                    FileName = table.Column<string>(type: "text", nullable: false),
                    FileSizeBytes = table.Column<long>(type: "bigint", nullable: false),
                    CrepeRmseHz = table.Column<double>(type: "double precision", nullable: true),
                    CrepeRmseCents = table.Column<double>(type: "double precision", nullable: true),
                    CrepeAccuracy50c = table.Column<double>(type: "double precision", nullable: true),
                    CrepePearsonR = table.Column<double>(type: "double precision", nullable: true),
                    CrepeLatencyMs = table.Column<long>(type: "bigint", nullable: true),
                    CrepeMedianHz = table.Column<double>(type: "double precision", nullable: true),
                    PyinRmseHz = table.Column<double>(type: "double precision", nullable: true),
                    PyinRmseCents = table.Column<double>(type: "double precision", nullable: true),
                    PyinAccuracy50c = table.Column<double>(type: "double precision", nullable: true),
                    PyinPearsonR = table.Column<double>(type: "double precision", nullable: true),
                    PyinLatencyMs = table.Column<long>(type: "bigint", nullable: true),
                    PyinMedianHz = table.Column<double>(type: "double precision", nullable: true),
                    SeparationRmseCentsBefore = table.Column<double>(type: "double precision", nullable: true),
                    SeparationRmseCentsAfter = table.Column<double>(type: "double precision", nullable: true),
                    SeparationLatencyMs = table.Column<long>(type: "bigint", nullable: true),
                    PitchTrajectoryJson = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LaboratoryExperimentSamples", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LaboratoryExperimentSamples_LaboratoryExperiments_Experimen~",
                        column: x => x.ExperimentId,
                        principalTable: "LaboratoryExperiments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_LaboratoryExperimentSamples_ExperimentId",
                table: "LaboratoryExperimentSamples",
                column: "ExperimentId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "LaboratoryExperimentSamples");

            migrationBuilder.DropTable(
                name: "LaboratoryExperiments");
        }
    }
}
