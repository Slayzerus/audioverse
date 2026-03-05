using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace AudioVerse.API.Migrations
{
    /// <inheritdoc />
    public partial class eventvideo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CollectionId",
                table: "EventPhotos",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ThumbnailKey",
                table: "EventPhotos",
                type: "text",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "EventCollages",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EventId = table.Column<int>(type: "integer", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    Width = table.Column<int>(type: "integer", nullable: false),
                    Height = table.Column<int>(type: "integer", nullable: false),
                    BackgroundColor = table.Column<string>(type: "text", nullable: true),
                    BackgroundImageKey = table.Column<string>(type: "text", nullable: true),
                    CreatedByUserId = table.Column<int>(type: "integer", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EventCollages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EventCollages_Events_EventId",
                        column: x => x.EventId,
                        principalTable: "Events",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "EventInviteTemplates",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "text", nullable: false),
                    OrganizationId = table.Column<int>(type: "integer", nullable: true),
                    EventId = table.Column<int>(type: "integer", nullable: true),
                    NotificationTemplate = table.Column<string>(type: "text", nullable: true),
                    EmailSubjectTemplate = table.Column<string>(type: "text", nullable: true),
                    EmailTemplate = table.Column<string>(type: "text", nullable: true),
                    SmsTemplate = table.Column<string>(type: "text", nullable: true),
                    CreatedByUserId = table.Column<int>(type: "integer", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EventInviteTemplates", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EventInviteTemplates_Events_EventId",
                        column: x => x.EventId,
                        principalTable: "Events",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_EventInviteTemplates_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "EventMediaCollections",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EventId = table.Column<int>(type: "integer", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    CoverThumbnailKey = table.Column<string>(type: "text", nullable: true),
                    OrderNumber = table.Column<int>(type: "integer", nullable: false),
                    AccessLevel = table.Column<int>(type: "integer", nullable: false),
                    CreatedByUserId = table.Column<int>(type: "integer", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EventMediaCollections", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EventMediaCollections_Events_EventId",
                        column: x => x.EventId,
                        principalTable: "Events",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "BulkInviteJobs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EventId = table.Column<int>(type: "integer", nullable: false),
                    TemplateId = table.Column<int>(type: "integer", nullable: false),
                    CreatedByUserId = table.Column<int>(type: "integer", nullable: true),
                    TotalContacts = table.Column<int>(type: "integer", nullable: false),
                    Sent = table.Column<int>(type: "integer", nullable: false),
                    Failed = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    ErrorLog = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BulkInviteJobs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BulkInviteJobs_EventInviteTemplates_TemplateId",
                        column: x => x.TemplateId,
                        principalTable: "EventInviteTemplates",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_BulkInviteJobs_Events_EventId",
                        column: x => x.EventId,
                        principalTable: "Events",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "EventVideos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EventId = table.Column<int>(type: "integer", nullable: false),
                    CollectionId = table.Column<int>(type: "integer", nullable: true),
                    ObjectKey = table.Column<string>(type: "text", nullable: false),
                    ContentType = table.Column<string>(type: "text", nullable: false),
                    FileSizeBytes = table.Column<long>(type: "bigint", nullable: false),
                    DurationSeconds = table.Column<int>(type: "integer", nullable: true),
                    Title = table.Column<string>(type: "text", nullable: true),
                    Description = table.Column<string>(type: "text", nullable: true),
                    ThumbnailKey = table.Column<string>(type: "text", nullable: true),
                    UploadedByUserId = table.Column<int>(type: "integer", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    OriginalId = table.Column<int>(type: "integer", nullable: true),
                    FiltersJson = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EventVideos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EventVideos_EventMediaCollections_CollectionId",
                        column: x => x.CollectionId,
                        principalTable: "EventMediaCollections",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_EventVideos_EventVideos_OriginalId",
                        column: x => x.OriginalId,
                        principalTable: "EventVideos",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_EventVideos_Events_EventId",
                        column: x => x.EventId,
                        principalTable: "Events",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "EventCollageItems",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CollageId = table.Column<int>(type: "integer", nullable: false),
                    PhotoId = table.Column<int>(type: "integer", nullable: true),
                    VideoId = table.Column<int>(type: "integer", nullable: true),
                    X = table.Column<double>(type: "double precision", nullable: false),
                    Y = table.Column<double>(type: "double precision", nullable: false),
                    Z = table.Column<int>(type: "integer", nullable: false),
                    Width = table.Column<double>(type: "double precision", nullable: false),
                    Height = table.Column<double>(type: "double precision", nullable: false),
                    Rotation = table.Column<double>(type: "double precision", nullable: false),
                    OrderInLayer = table.Column<int>(type: "integer", nullable: false),
                    FiltersJson = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EventCollageItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EventCollageItems_EventCollages_CollageId",
                        column: x => x.CollageId,
                        principalTable: "EventCollages",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_EventCollageItems_EventPhotos_PhotoId",
                        column: x => x.PhotoId,
                        principalTable: "EventPhotos",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_EventCollageItems_EventVideos_VideoId",
                        column: x => x.VideoId,
                        principalTable: "EventVideos",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "EventMediaTags",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    PhotoId = table.Column<int>(type: "integer", nullable: true),
                    VideoId = table.Column<int>(type: "integer", nullable: true),
                    ContactId = table.Column<int>(type: "integer", nullable: true),
                    UserId = table.Column<int>(type: "integer", nullable: true),
                    Label = table.Column<string>(type: "text", nullable: true),
                    X = table.Column<double>(type: "double precision", nullable: false),
                    Y = table.Column<double>(type: "double precision", nullable: false),
                    Width = table.Column<double>(type: "double precision", nullable: true),
                    Height = table.Column<double>(type: "double precision", nullable: true),
                    TimestampSeconds = table.Column<int>(type: "integer", nullable: true),
                    TaggedByUserId = table.Column<int>(type: "integer", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EventMediaTags", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EventMediaTags_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_EventMediaTags_Contacts_ContactId",
                        column: x => x.ContactId,
                        principalTable: "Contacts",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_EventMediaTags_EventPhotos_PhotoId",
                        column: x => x.PhotoId,
                        principalTable: "EventPhotos",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_EventMediaTags_EventVideos_VideoId",
                        column: x => x.VideoId,
                        principalTable: "EventVideos",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_EventPhotos_CollectionId",
                table: "EventPhotos",
                column: "CollectionId");

            migrationBuilder.CreateIndex(
                name: "IX_BulkInviteJobs_EventId",
                table: "BulkInviteJobs",
                column: "EventId");

            migrationBuilder.CreateIndex(
                name: "IX_BulkInviteJobs_TemplateId",
                table: "BulkInviteJobs",
                column: "TemplateId");

            migrationBuilder.CreateIndex(
                name: "IX_EventCollageItems_CollageId",
                table: "EventCollageItems",
                column: "CollageId");

            migrationBuilder.CreateIndex(
                name: "IX_EventCollageItems_PhotoId",
                table: "EventCollageItems",
                column: "PhotoId");

            migrationBuilder.CreateIndex(
                name: "IX_EventCollageItems_VideoId",
                table: "EventCollageItems",
                column: "VideoId");

            migrationBuilder.CreateIndex(
                name: "IX_EventCollages_EventId",
                table: "EventCollages",
                column: "EventId");

            migrationBuilder.CreateIndex(
                name: "IX_EventInviteTemplates_EventId",
                table: "EventInviteTemplates",
                column: "EventId");

            migrationBuilder.CreateIndex(
                name: "IX_EventInviteTemplates_OrganizationId",
                table: "EventInviteTemplates",
                column: "OrganizationId");

            migrationBuilder.CreateIndex(
                name: "IX_EventMediaCollections_EventId",
                table: "EventMediaCollections",
                column: "EventId");

            migrationBuilder.CreateIndex(
                name: "IX_EventMediaTags_ContactId",
                table: "EventMediaTags",
                column: "ContactId");

            migrationBuilder.CreateIndex(
                name: "IX_EventMediaTags_PhotoId",
                table: "EventMediaTags",
                column: "PhotoId");

            migrationBuilder.CreateIndex(
                name: "IX_EventMediaTags_UserId",
                table: "EventMediaTags",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_EventMediaTags_VideoId",
                table: "EventMediaTags",
                column: "VideoId");

            migrationBuilder.CreateIndex(
                name: "IX_EventVideos_CollectionId",
                table: "EventVideos",
                column: "CollectionId");

            migrationBuilder.CreateIndex(
                name: "IX_EventVideos_EventId",
                table: "EventVideos",
                column: "EventId");

            migrationBuilder.CreateIndex(
                name: "IX_EventVideos_OriginalId",
                table: "EventVideos",
                column: "OriginalId");

            migrationBuilder.AddForeignKey(
                name: "FK_EventPhotos_EventMediaCollections_CollectionId",
                table: "EventPhotos",
                column: "CollectionId",
                principalTable: "EventMediaCollections",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_EventPhotos_EventMediaCollections_CollectionId",
                table: "EventPhotos");

            migrationBuilder.DropTable(
                name: "BulkInviteJobs");

            migrationBuilder.DropTable(
                name: "EventCollageItems");

            migrationBuilder.DropTable(
                name: "EventMediaTags");

            migrationBuilder.DropTable(
                name: "EventInviteTemplates");

            migrationBuilder.DropTable(
                name: "EventCollages");

            migrationBuilder.DropTable(
                name: "EventVideos");

            migrationBuilder.DropTable(
                name: "EventMediaCollections");

            migrationBuilder.DropIndex(
                name: "IX_EventPhotos_CollectionId",
                table: "EventPhotos");

            migrationBuilder.DropColumn(
                name: "CollectionId",
                table: "EventPhotos");

            migrationBuilder.DropColumn(
                name: "ThumbnailKey",
                table: "EventPhotos");
        }
    }
}
