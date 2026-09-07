using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SPS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddApplicationMemberSupport : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ContactPerson",
                table: "Company",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "MemberRole",
                table: "Company",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "ApplicationMember",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ApplicationId = table.Column<Guid>(type: "uuid", nullable: false),
                    ContactName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Position = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Email = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    Phone = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Extension = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    MobilePhone = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    PasswordHash = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    MemberPosition = table.Column<int>(type: "integer", nullable: false),
                    OrderIndex = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    CreatedMemberId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ApplicationMember", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ApplicationMember_MemberApplication_ApplicationId",
                        column: x => x.ApplicationId,
                        principalTable: "MemberApplication",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ApplicationMember_Members_CreatedMemberId",
                        column: x => x.CreatedMemberId,
                        principalTable: "Members",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ApplicationMember_ApplicationId",
                table: "ApplicationMember",
                column: "ApplicationId");

            migrationBuilder.CreateIndex(
                name: "IX_ApplicationMember_ApplicationId_OrderIndex",
                table: "ApplicationMember",
                columns: new[] { "ApplicationId", "OrderIndex" });

            migrationBuilder.CreateIndex(
                name: "IX_ApplicationMember_CreatedMemberId",
                table: "ApplicationMember",
                column: "CreatedMemberId");

            migrationBuilder.CreateIndex(
                name: "IX_ApplicationMember_Email",
                table: "ApplicationMember",
                column: "Email");

            // 將現有申請的單一成員數據遷移到 ApplicationMember 表
            migrationBuilder.Sql(@"
                INSERT INTO ""ApplicationMember"" (
                    ""Id"", ""ApplicationId"", ""ContactName"", ""Position"", ""Email"",
                    ""Phone"", ""Extension"", ""MobilePhone"", ""PasswordHash"",
                    ""MemberPosition"", ""OrderIndex"", ""Status"", ""CreatedTime"", ""UpdatedTime""
                )
                SELECT
                    gen_random_uuid(),
                    ""Id"" as ""ApplicationId"",
                    ""ContactName"",
                    COALESCE(""Position"", '聯絡人'),
                    ""Email"",
                    ""Phone"",
                    ""Extension"",
                    ""MobilePhone"",
                    ""PasswordHash"",
                    1, -- Manager
                    0, -- 第一個成員
                    0, -- Active
                    ""CreatedTime"",
                    ""UpdatedTime""
                FROM ""MemberApplication""
                WHERE ""Status"" IN (1, 2, 3) -- PendingReview, UnderReview, Approved
                AND ""ContactName"" IS NOT NULL
                AND ""Email"" IS NOT NULL;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ApplicationMember");

            migrationBuilder.DropColumn(
                name: "ContactPerson",
                table: "Company");

            migrationBuilder.DropColumn(
                name: "MemberRole",
                table: "Company");
        }
    }
}
