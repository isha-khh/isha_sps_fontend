using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SPS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddMemberSystemPhase1 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // CompanyLevel 列舉改名：Basic/Standard/Premium/VIP(0/1/2/3)
            // → Standard/Excellent/Emerging(0/1/2)。欄位型別沒變（都是
            // smallint），EF 偵測不到資料需要轉換，手動補上資料映射。
            // 依來源值由小到大依序處理，避免中途覆寫到還沒轉換的舊值：
            // 舊 Standard(1) → 新 Standard(0)；舊 Premium(2) → 新 Excellent(1)；
            // 舊 VIP(3) → 新 Emerging(2)；舊 Basic(0) 已經等於新 Standard(0)
            // 不需處理。
            migrationBuilder.Sql("UPDATE \"Company\" SET \"Level\" = 0 WHERE \"Level\" = 1;");
            migrationBuilder.Sql("UPDATE \"Company\" SET \"Level\" = 1 WHERE \"Level\" = 2;");
            migrationBuilder.Sql("UPDATE \"Company\" SET \"Level\" = 2 WHERE \"Level\" = 3;");

            migrationBuilder.AddColumn<Guid>(
                name: "ApplicationId",
                table: "Scorings",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "EnteredByUserId",
                table: "Scorings",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ExpertName",
                table: "Scorings",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "FinancialStatusScore",
                table: "Scorings",
                type: "numeric",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "FinancialSystemScore",
                table: "Scorings",
                type: "numeric",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "HumanResourcesScore",
                table: "Scorings",
                type: "numeric",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "ProductTrackRecordScore",
                table: "Scorings",
                type: "numeric",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "RelevantExperienceScore",
                table: "Scorings",
                type: "numeric",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "TeamExperienceScore",
                table: "Scorings",
                type: "numeric",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CompanyName",
                table: "Members",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Industry",
                table: "Members",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ApplicantType",
                table: "MemberApplication",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<Guid>(
                name: "ExistingMemberId",
                table: "MemberApplication",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<short>(
                name: "SupplierTier",
                table: "MemberApplication",
                type: "smallint",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Scorings_ApplicationId",
                table: "Scorings",
                column: "ApplicationId");

            migrationBuilder.CreateIndex(
                name: "IX_Scorings_EnteredByUserId",
                table: "Scorings",
                column: "EnteredByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_MemberApplication_ExistingMemberId",
                table: "MemberApplication",
                column: "ExistingMemberId");

            migrationBuilder.AddForeignKey(
                name: "FK_MemberApplication_Members_ExistingMemberId",
                table: "MemberApplication",
                column: "ExistingMemberId",
                principalTable: "Members",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Scorings_MemberApplication_ApplicationId",
                table: "Scorings",
                column: "ApplicationId",
                principalTable: "MemberApplication",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Scorings_Users_EnteredByUserId",
                table: "Scorings",
                column: "EnteredByUserId",
                principalTable: "Users",
                principalColumn: "Id");

            // 既有申請都是改版前的企業申請（個人會員流程這次才新增），
            // 新欄位預設值 0 不是列舉裡任何一個有效值（Individual=1/
            // Company=2），回填成 Company，避免 Stage 2 的條件式驗證誤判
            // 這些舊資料不需要統編/負責人等企業欄位。
            migrationBuilder.Sql("UPDATE \"MemberApplication\" SET \"ApplicantType\" = 2 WHERE \"ApplicantType\" = 0;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_MemberApplication_Members_ExistingMemberId",
                table: "MemberApplication");

            migrationBuilder.DropForeignKey(
                name: "FK_Scorings_MemberApplication_ApplicationId",
                table: "Scorings");

            migrationBuilder.DropForeignKey(
                name: "FK_Scorings_Users_EnteredByUserId",
                table: "Scorings");

            migrationBuilder.DropIndex(
                name: "IX_Scorings_ApplicationId",
                table: "Scorings");

            migrationBuilder.DropIndex(
                name: "IX_Scorings_EnteredByUserId",
                table: "Scorings");

            migrationBuilder.DropIndex(
                name: "IX_MemberApplication_ExistingMemberId",
                table: "MemberApplication");

            migrationBuilder.DropColumn(
                name: "ApplicationId",
                table: "Scorings");

            migrationBuilder.DropColumn(
                name: "EnteredByUserId",
                table: "Scorings");

            migrationBuilder.DropColumn(
                name: "ExpertName",
                table: "Scorings");

            migrationBuilder.DropColumn(
                name: "FinancialStatusScore",
                table: "Scorings");

            migrationBuilder.DropColumn(
                name: "FinancialSystemScore",
                table: "Scorings");

            migrationBuilder.DropColumn(
                name: "HumanResourcesScore",
                table: "Scorings");

            migrationBuilder.DropColumn(
                name: "ProductTrackRecordScore",
                table: "Scorings");

            migrationBuilder.DropColumn(
                name: "RelevantExperienceScore",
                table: "Scorings");

            migrationBuilder.DropColumn(
                name: "TeamExperienceScore",
                table: "Scorings");

            migrationBuilder.DropColumn(
                name: "CompanyName",
                table: "Members");

            migrationBuilder.DropColumn(
                name: "Industry",
                table: "Members");

            migrationBuilder.DropColumn(
                name: "ApplicantType",
                table: "MemberApplication");

            migrationBuilder.DropColumn(
                name: "ExistingMemberId",
                table: "MemberApplication");

            migrationBuilder.DropColumn(
                name: "SupplierTier",
                table: "MemberApplication");

            // 回復 CompanyLevel 舊值。新 Standard(0) 無法區分原本是舊
            // Basic(0) 還是舊 Standard(1)，這裡一律還原成舊 Standard(1)
            // ——回滾本來就是不得已的操作，且目前沒有依賴這個區分的正式資料。
            migrationBuilder.Sql("UPDATE \"Company\" SET \"Level\" = 3 WHERE \"Level\" = 2;");
            migrationBuilder.Sql("UPDATE \"Company\" SET \"Level\" = 2 WHERE \"Level\" = 1;");
            migrationBuilder.Sql("UPDATE \"Company\" SET \"Level\" = 1 WHERE \"Level\" = 0;");
        }
    }
}
