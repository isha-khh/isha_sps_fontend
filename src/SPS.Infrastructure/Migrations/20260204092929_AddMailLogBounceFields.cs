using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SPS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddMailLogBounceFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "BounceCode",
                table: "MailLogs",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BounceReason",
                table: "MailLogs",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "BounceStatus",
                table: "MailLogs",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "BounceTime",
                table: "MailLogs",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MessageId",
                table: "MailLogs",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RemoteMta",
                table: "MailLogs",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BounceCode",
                table: "MailLogs");

            migrationBuilder.DropColumn(
                name: "BounceReason",
                table: "MailLogs");

            migrationBuilder.DropColumn(
                name: "BounceStatus",
                table: "MailLogs");

            migrationBuilder.DropColumn(
                name: "BounceTime",
                table: "MailLogs");

            migrationBuilder.DropColumn(
                name: "MessageId",
                table: "MailLogs");

            migrationBuilder.DropColumn(
                name: "RemoteMta",
                table: "MailLogs");
        }
    }
}
