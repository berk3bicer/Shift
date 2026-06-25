using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Shift.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAttachments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ChecklistItem_Checklists_ChecklistId",
                table: "ChecklistItem");

            migrationBuilder.DropPrimaryKey(
                name: "PK_ChecklistItem",
                table: "ChecklistItem");

            migrationBuilder.RenameTable(
                name: "ChecklistItem",
                newName: "ChecklistItems");

            migrationBuilder.RenameIndex(
                name: "IX_ChecklistItem_ChecklistId",
                table: "ChecklistItems",
                newName: "IX_ChecklistItems_ChecklistId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_ChecklistItems",
                table: "ChecklistItems",
                column: "Id");

            migrationBuilder.CreateTable(
                name: "Attachments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    OwnerType = table.Column<int>(type: "integer", nullable: false),
                    OwnerId = table.Column<Guid>(type: "uuid", nullable: false),
                    StorageKey = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    ContentType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    FileName = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    UploadedByUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Attachments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Attachments_Users_UploadedByUserId",
                        column: x => x.UploadedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Attachments_OwnerType_OwnerId",
                table: "Attachments",
                columns: new[] { "OwnerType", "OwnerId" });

            migrationBuilder.CreateIndex(
                name: "IX_Attachments_UploadedByUserId",
                table: "Attachments",
                column: "UploadedByUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_ChecklistItems_Checklists_ChecklistId",
                table: "ChecklistItems",
                column: "ChecklistId",
                principalTable: "Checklists",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ChecklistItems_Checklists_ChecklistId",
                table: "ChecklistItems");

            migrationBuilder.DropTable(
                name: "Attachments");

            migrationBuilder.DropPrimaryKey(
                name: "PK_ChecklistItems",
                table: "ChecklistItems");

            migrationBuilder.RenameTable(
                name: "ChecklistItems",
                newName: "ChecklistItem");

            migrationBuilder.RenameIndex(
                name: "IX_ChecklistItems_ChecklistId",
                table: "ChecklistItem",
                newName: "IX_ChecklistItem_ChecklistId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_ChecklistItem",
                table: "ChecklistItem",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_ChecklistItem_Checklists_ChecklistId",
                table: "ChecklistItem",
                column: "ChecklistId",
                principalTable: "Checklists",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
