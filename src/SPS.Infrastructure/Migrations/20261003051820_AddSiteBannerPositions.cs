using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SPS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSiteBannerPositions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 前台各頁面原本寫死的假廣告／假輪播改由後台「橫幅管理」維護，這裡補上對應版位。
            // 純資料 migration（沒有 schema 變更）；用 WHERE NOT EXISTS 讓重跑安全
            migrationBuilder.Sql(@"
                INSERT INTO ""BannerPositions"" (""Code"", ""Name"", ""DataMode"", ""Width"", ""Height"", ""Remark"", ""CreatedTime"", ""UpdatedTime"")
                SELECT 'sidebar-news', '公告事項側欄廣告', 0, 400, 300, '公告事項列表與詳情頁右側欄的廣告圖片（4:3），依排序由上到下全部顯示', now(), now()
                WHERE NOT EXISTS (SELECT 1 FROM ""BannerPositions"" WHERE ""Code"" = 'sidebar-news');
            ");

            migrationBuilder.Sql(@"
                INSERT INTO ""BannerPositions"" (""Code"", ""Name"", ""DataMode"", ""Width"", ""Height"", ""Remark"", ""CreatedTime"", ""UpdatedTime"")
                SELECT 'sidebar-serve', '技術工具側欄廣告', 0, 400, 300, '技術工具（/serve）列表與詳情頁右側欄的廣告圖片（4:3），依排序由上到下全部顯示', now(), now()
                WHERE NOT EXISTS (SELECT 1 FROM ""BannerPositions"" WHERE ""Code"" = 'sidebar-serve');
            ");

            migrationBuilder.Sql(@"
                INSERT INTO ""BannerPositions"" (""Code"", ""Name"", ""DataMode"", ""Width"", ""Height"", ""Remark"", ""CreatedTime"", ""UpdatedTime"")
                SELECT 'sidebar-talent', '人才培育側欄廣告', 0, 400, 300, '人才培育（/talent）列表與詳情頁右側欄的廣告圖片（4:3），依排序由上到下全部顯示', now(), now()
                WHERE NOT EXISTS (SELECT 1 FROM ""BannerPositions"" WHERE ""Code"" = 'sidebar-talent');
            ");

            migrationBuilder.Sql(@"
                INSERT INTO ""BannerPositions"" (""Code"", ""Name"", ""DataMode"", ""Width"", ""Height"", ""Remark"", ""CreatedTime"", ""UpdatedTime"")
                SELECT 'sidebar-tutoring', '產業輔導側欄廣告', 0, 400, 300, '產業輔導（/tutoring）列表與詳情頁右側欄的廣告圖片（4:3），依排序由上到下全部顯示', now(), now()
                WHERE NOT EXISTS (SELECT 1 FROM ""BannerPositions"" WHERE ""Code"" = 'sidebar-tutoring');
            ");

            migrationBuilder.Sql(@"
                INSERT INTO ""BannerPositions"" (""Code"", ""Name"", ""DataMode"", ""Width"", ""Height"", ""Remark"", ""CreatedTime"", ""UpdatedTime"")
                SELECT 'sidebar-promotion', '宣傳推廣側欄廣告', 0, 400, 300, '宣傳推廣（/promotion）列表、影片與詳情頁右側欄的廣告圖片（4:3），依排序由上到下全部顯示', now(), now()
                WHERE NOT EXISTS (SELECT 1 FROM ""BannerPositions"" WHERE ""Code"" = 'sidebar-promotion');
            ");

            migrationBuilder.Sql(@"
                INSERT INTO ""BannerPositions"" (""Code"", ""Name"", ""DataMode"", ""Width"", ""Height"", ""Remark"", ""CreatedTime"", ""UpdatedTime"")
                SELECT 'sidebar-matching', '媒合專區側欄廣告', 0, 400, 300, '媒合專區（/matching）列表與詳情頁右側欄的廣告圖片（4:3），依排序由上到下全部顯示', now(), now()
                WHERE NOT EXISTS (SELECT 1 FROM ""BannerPositions"" WHERE ""Code"" = 'sidebar-matching');
            ");

            migrationBuilder.Sql(@"
                INSERT INTO ""BannerPositions"" (""Code"", ""Name"", ""DataMode"", ""Width"", ""Height"", ""Remark"", ""CreatedTime"", ""UpdatedTime"")
                SELECT 'sidebar-support', '輔助資源側欄廣告', 0, 400, 300, '輔助資源（/support）右側欄下方的廣告圖片（4:3），依排序由上到下全部顯示', now(), now()
                WHERE NOT EXISTS (SELECT 1 FROM ""BannerPositions"" WHERE ""Code"" = 'sidebar-support');
            ");

            migrationBuilder.Sql(@"
                INSERT INTO ""BannerPositions"" (""Code"", ""Name"", ""DataMode"", ""Width"", ""Height"", ""Remark"", ""CreatedTime"", ""UpdatedTime"")
                SELECT 'sidebar-support-tutoring', '輔助資源側欄「產業輔導」導流', 0, 400, 300, '輔助資源（/support）右側欄上方「產業輔導」標題下的導流圖片（4:3），通常放產業輔導相關活動', now(), now()
                WHERE NOT EXISTS (SELECT 1 FROM ""BannerPositions"" WHERE ""Code"" = 'sidebar-support-tutoring');
            ");

            migrationBuilder.Sql(@"
                INSERT INTO ""BannerPositions"" (""Code"", ""Name"", ""DataMode"", ""Width"", ""Height"", ""Remark"", ""CreatedTime"", ""UpdatedTime"")
                SELECT 'talent-top', '人才培育頂部輪播', 0, 1400, 500, '人才培育（/talent）頁最上方輪播，依排序輪播所有上架中的 Banner', now(), now()
                WHERE NOT EXISTS (SELECT 1 FROM ""BannerPositions"" WHERE ""Code"" = 'talent-top');
            ");

            migrationBuilder.Sql(@"
                INSERT INTO ""BannerPositions"" (""Code"", ""Name"", ""DataMode"", ""Width"", ""Height"", ""Remark"", ""CreatedTime"", ""UpdatedTime"")
                SELECT 'support-top', '輔助資源頂部輪播', 0, 1400, 500, '輔助資源（/support）頁最上方輪播，依排序輪播所有上架中的 Banner', now(), now()
                WHERE NOT EXISTS (SELECT 1 FROM ""BannerPositions"" WHERE ""Code"" = 'support-top');
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // 先刪掛在這些版位上的 Banner，再刪版位（沿用 AddBannerSchedulingAndHeroFields 的做法）
            migrationBuilder.Sql(@"
                DELETE FROM ""Banners""
                WHERE ""PositionId"" IN (SELECT ""Id"" FROM ""BannerPositions"" WHERE ""Code"" IN ('sidebar-news', 'sidebar-serve', 'sidebar-talent', 'sidebar-tutoring', 'sidebar-promotion', 'sidebar-matching', 'sidebar-support', 'sidebar-support-tutoring', 'talent-top', 'support-top'));
                DELETE FROM ""BannerPositions"" WHERE ""Code"" IN ('sidebar-news', 'sidebar-serve', 'sidebar-talent', 'sidebar-tutoring', 'sidebar-promotion', 'sidebar-matching', 'sidebar-support', 'sidebar-support-tutoring', 'talent-top', 'support-top');
            ");
        }
    }
}
