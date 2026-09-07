using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SPS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddInitiatorUserIdToMessages : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "InitiatorUserId",
                table: "Messages",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Messages_InitiatorUserId",
                table: "Messages",
                column: "InitiatorUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Messages_Users_InitiatorUserId",
                table: "Messages",
                column: "InitiatorUserId",
                principalTable: "Users",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Messages_Users_InitiatorUserId",
                table: "Messages");

            migrationBuilder.DropIndex(
                name: "IX_Messages_InitiatorUserId",
                table: "Messages");

            migrationBuilder.DropColumn(
                name: "InitiatorUserId",
                table: "Messages");
        }
    }
}
