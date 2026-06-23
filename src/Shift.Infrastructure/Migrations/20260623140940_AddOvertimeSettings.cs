using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Shift.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddOvertimeSettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "OvertimeSettings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    WeeklyOvertimeThresholdHours = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: false),
                    OvertimeMultiplier = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: false),
                    NightMultiplier = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: false),
                    NightStart = table.Column<TimeOnly>(type: "time without time zone", nullable: false),
                    NightEnd = table.Column<TimeOnly>(type: "time without time zone", nullable: false),
                    WeekendMultiplier = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: false),
                    HolidayMultiplier = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OvertimeSettings", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_OvertimeSettings_TenantId",
                table: "OvertimeSettings",
                column: "TenantId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "OvertimeSettings");
        }
    }
}
