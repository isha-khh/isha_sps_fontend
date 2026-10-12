using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace SPS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddMemberNotificationsAndInquiryReply : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "RepliedAt",
                table: "Inquiries",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "RepliedByUserId",
                table: "Inquiries",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReplyMessage",
                table: "Inquiries",
                type: "text",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "MemberNotifications",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    MemberId = table.Column<Guid>(type: "uuid", nullable: false),
                    Type = table.Column<int>(type: "integer", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false),
                    Content = table.Column<string>(type: "text", nullable: true),
                    LinkPath = table.Column<string>(type: "text", nullable: true),
                    IsRead = table.Column<bool>(type: "boolean", nullable: false),
                    ReadAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MemberNotifications", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_MemberNotifications_MemberId_IsRead_CreatedTime",
                table: "MemberNotifications",
                columns: new[] { "MemberId", "IsRead", "CreatedTime" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MemberNotifications");

            migrationBuilder.DropColumn(
                name: "RepliedAt",
                table: "Inquiries");

            migrationBuilder.DropColumn(
                name: "RepliedByUserId",
                table: "Inquiries");

            migrationBuilder.DropColumn(
                name: "ReplyMessage",
                table: "Inquiries");
        }
    }
}
