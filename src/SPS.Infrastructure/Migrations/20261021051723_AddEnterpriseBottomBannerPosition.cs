using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SPS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddEnterpriseBottomBannerPosition : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 企業名錄（/matching/enterprise）列表下方的橫幅原本寫死在前台（issue #55），改由後台「橫幅管理」維護，這裡補上版位。
            // 純資料 migration（沒有 schema 變更）；用 WHERE NOT EXISTS 讓重跑安全
            migrationBuilder.Sql(@"
                INSERT INTO ""BannerPositions"" (""Code"", ""Name"", ""DataMode"", ""Width"", ""Height"", ""Remark"", ""CreatedTime"", ""UpdatedTime"")
                SELECT 'enterprise-bottom', '企業名錄底部橫幅', 0, 1100, 400, '企業名錄（/matching/enterprise）列表分頁下方的橫幅圖片，依排序由上到下全部顯示；沒有上架中的 Banner 就不顯示這個區塊', now(), now()
                WHERE NOT EXISTS (SELECT 1 FROM ""BannerPositions"" WHERE ""Code"" = 'enterprise-bottom');
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // 先刪掛在這個版位上的 Banner，再刪版位
            migrationBuilder.Sql(@"
                DELETE FROM ""Banners""
                WHERE ""PositionId"" IN (SELECT ""Id"" FROM ""BannerPositions"" WHERE ""Code"" = 'enterprise-bottom');
                DELETE FROM ""BannerPositions"" WHERE ""Code"" = 'enterprise-bottom';
            ");
        }
    }
}
