using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SPS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddLogEnhancements : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Content",
                table: "MailLogs",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ErrorMessage",
                table: "MailLogs",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsSuccess",
                table: "MailLogs",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "MailType",
                table: "MailLogs",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RelatedEntityId",
                table: "MailLogs",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RelatedEntityType",
                table: "MailLogs",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RelatedUserId",
                table: "MailLogs",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Subject",
                table: "MailLogs",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "ActionLogs",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ErrorMessage",
                table: "ActionLogs",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "ExecutionDuration",
                table: "ActionLogs",
                type: "bigint",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "IpAddress",
                table: "ActionLogs",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsSuccess",
                table: "ActionLogs",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "UserAgent",
                table: "ActionLogs",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Content",
                table: "MailLogs");

            migrationBuilder.DropColumn(
                name: "ErrorMessage",
                table: "MailLogs");

            migrationBuilder.DropColumn(
                name: "IsSuccess",
                table: "MailLogs");

            migrationBuilder.DropColumn(
                name: "MailType",
                table: "MailLogs");

            migrationBuilder.DropColumn(
                name: "RelatedEntityId",
                table: "MailLogs");

            migrationBuilder.DropColumn(
                name: "RelatedEntityType",
                table: "MailLogs");

            migrationBuilder.DropColumn(
                name: "RelatedUserId",
                table: "MailLogs");

            migrationBuilder.DropColumn(
                name: "Subject",
                table: "MailLogs");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "ActionLogs");

            migrationBuilder.DropColumn(
                name: "ErrorMessage",
                table: "ActionLogs");

            migrationBuilder.DropColumn(
                name: "ExecutionDuration",
                table: "ActionLogs");

            migrationBuilder.DropColumn(
                name: "IpAddress",
                table: "ActionLogs");

            migrationBuilder.DropColumn(
                name: "IsSuccess",
                table: "ActionLogs");

            migrationBuilder.DropColumn(
                name: "UserAgent",
                table: "ActionLogs");
        }
    }
}
