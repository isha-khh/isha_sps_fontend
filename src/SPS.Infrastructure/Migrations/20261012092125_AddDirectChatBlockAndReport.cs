using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace SPS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddDirectChatBlockAndReport : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "DemandId",
                table: "ChatRecord",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "DemandReplyId",
                table: "ChatRecord",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "ChatReports",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ChatRecordId = table.Column<long>(type: "bigint", nullable: false),
                    ReporterMemberId = table.Column<Guid>(type: "uuid", nullable: false),
                    ReportedMemberId = table.Column<Guid>(type: "uuid", nullable: false),
                    Reason = table.Column<int>(type: "integer", nullable: false),
                    Detail = table.Column<string>(type: "text", nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    HandlerNote = table.Column<string>(type: "text", nullable: true),
                    HandledByUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    HandledTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChatReports", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "MemberBlocks",
                columns: table => new
                {
                    BlockerMemberId = table.Column<Guid>(type: "uuid", nullable: false),
                    BlockedMemberId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MemberBlocks", x => new { x.BlockerMemberId, x.BlockedMemberId });
                });

            migrationBuilder.CreateIndex(
                name: "IX_ChatRecord_DemandReplyId",
                table: "ChatRecord",
                column: "DemandReplyId");

            migrationBuilder.CreateIndex(
                name: "IX_ChatReports_ChatRecordId",
                table: "ChatReports",
                column: "ChatRecordId");

            migrationBuilder.CreateIndex(
                name: "IX_ChatReports_Status_CreatedTime",
                table: "ChatReports",
                columns: new[] { "Status", "CreatedTime" });

            migrationBuilder.CreateIndex(
                name: "IX_MemberBlocks_BlockedMemberId",
                table: "MemberBlocks",
                column: "BlockedMemberId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ChatReports");

            migrationBuilder.DropTable(
                name: "MemberBlocks");

            migrationBuilder.DropIndex(
                name: "IX_ChatRecord_DemandReplyId",
                table: "ChatRecord");

            migrationBuilder.DropColumn(
                name: "DemandId",
                table: "ChatRecord");

            migrationBuilder.DropColumn(
                name: "DemandReplyId",
                table: "ChatRecord");
        }
    }
}
