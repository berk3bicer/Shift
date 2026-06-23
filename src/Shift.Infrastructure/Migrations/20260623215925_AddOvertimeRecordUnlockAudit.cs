using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Shift.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddOvertimeRecordUnlockAudit : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "UnlockedAt",
                table: "OvertimeRecords",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "UnlockedByUserId",
                table: "OvertimeRecords",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_OvertimeRecords_UnlockedByUserId",
                table: "OvertimeRecords",
                column: "UnlockedByUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_OvertimeRecords_Users_UnlockedByUserId",
                table: "OvertimeRecords",
                column: "UnlockedByUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_OvertimeRecords_Users_UnlockedByUserId",
                table: "OvertimeRecords");

            migrationBuilder.DropIndex(
                name: "IX_OvertimeRecords_UnlockedByUserId",
                table: "OvertimeRecords");

            migrationBuilder.DropColumn(
                name: "UnlockedAt",
                table: "OvertimeRecords");

            migrationBuilder.DropColumn(
                name: "UnlockedByUserId",
                table: "OvertimeRecords");
        }
    }
}
