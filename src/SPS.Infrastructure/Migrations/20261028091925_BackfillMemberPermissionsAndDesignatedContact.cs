using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SPS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class BackfillMemberPermissionsAndDesignatedContact : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // issue #81 純資料修復（可重複執行，不改資料表結構）：
            // 1) 前台會員權限統一：擁有者（Manager）可編輯公司資料；一般成員（Employee）可查看公司資料。
            //    之前審核通過的員工沒有 ViewCompany，經理在會員中心新增的成員（不論身分）只有 ViewCompany。
            //    位元對應 MemberPermission：ViewCompany=1、EditCompany=2、產品 1<<10～1<<13（15360）、需求 1<<20～1<<23（15728640）。
            migrationBuilder.Sql("""
                UPDATE "Members" SET "Permissions" = CASE
                    WHEN "Role" = 1 AND "MemberPosition" = 1 THEN 15363::bigint      -- 供給端擁有者
                    WHEN "Role" = 1 AND "MemberPosition" = 2 THEN 15361::bigint      -- 供給端一般成員
                    WHEN "Role" = 2 AND "MemberPosition" = 1 THEN 15728643::bigint   -- 需求端擁有者
                    WHEN "Role" = 2 AND "MemberPosition" = 2 THEN 15728641::bigint   -- 需求端一般成員
                END
                WHERE "CompanyId" IS NOT NULL
                  AND "Role" IN (1, 2)
                  AND "MemberPosition" IN (1, 2)
                  AND "Permissions" IS DISTINCT FROM CASE
                    WHEN "Role" = 1 AND "MemberPosition" = 1 THEN 15363::bigint
                    WHEN "Role" = 1 AND "MemberPosition" = 2 THEN 15361::bigint
                    WHEN "Role" = 2 AND "MemberPosition" = 1 THEN 15728643::bigint
                    WHEN "Role" = 2 AND "MemberPosition" = 2 THEN 15728641::bigint
                END;
                """);

            // 2) 公司還沒有任何指定聯絡窗口時，把最早建立、狀態啟用的擁有者設為聯絡窗口（取得聯繫窗口不再因此查無人）
            migrationBuilder.Sql("""
                UPDATE "Members" m SET "IsDesignatedContact" = TRUE
                FROM (
                    SELECT DISTINCT ON ("CompanyId") "Id"
                    FROM "Members"
                    WHERE "CompanyId" IS NOT NULL AND "MemberPosition" = 1 AND "Status" = 1 AND "DataMode" = 0
                    ORDER BY "CompanyId", "CreatedTime"
                ) first_manager
                WHERE m."Id" = first_manager."Id"
                  AND NOT EXISTS (
                      SELECT 1 FROM "Members" x WHERE x."CompanyId" = m."CompanyId" AND x."IsDesignatedContact"
                  );
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // 純資料修復，不還原
        }
    }
}
