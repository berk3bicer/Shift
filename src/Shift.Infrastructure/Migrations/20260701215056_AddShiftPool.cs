using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Shift.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddShiftPool : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ShiftPoolSettings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    ApprovalMode = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ShiftPoolSettings", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ShiftSwaps",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    ShiftId = table.Column<Guid>(type: "uuid", nullable: false),
                    RequestedByUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    TargetUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    Type = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ShiftSwaps", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ShiftSwaps_Shifts_ShiftId",
                        column: x => x.ShiftId,
                        principalTable: "Shifts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ShiftSwaps_Users_RequestedByUserId",
                        column: x => x.RequestedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ShiftSwaps_Users_TargetUserId",
                        column: x => x.TargetUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ShiftPoolSettings_TenantId",
                table: "ShiftPoolSettings",
                column: "TenantId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ShiftSwaps_RequestedByUserId",
                table: "ShiftSwaps",
                column: "RequestedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ShiftSwaps_ShiftId",
                table: "ShiftSwaps",
                column: "ShiftId");

            migrationBuilder.CreateIndex(
                name: "IX_ShiftSwaps_Status",
                table: "ShiftSwaps",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_ShiftSwaps_TargetUserId",
                table: "ShiftSwaps",
                column: "TargetUserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ShiftPoolSettings");

            migrationBuilder.DropTable(
                name: "ShiftSwaps");
        }
    }
}
