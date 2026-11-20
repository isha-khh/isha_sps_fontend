using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SPS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RenameBannerPositionsToMatchFrontend : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            foreach (var (code, oldName, newName, oldRemark, newRemark) in Renames)
                Rename(migrationBuilder, code, oldName, newName, oldRemark, newRemark);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            foreach (var (code, oldName, newName, oldRemark, newRemark) in Renames)
                Rename(migrationBuilder, code, newName, oldName, newRemark, oldRemark);
        }

        /// <summary>
        /// 後台廣告版位名稱對齊前台選單用語（issue #86）：宣傳推廣→推廣專區、媒合專區→媒合對接、輔助資源→本計畫補助。
        /// 只改「還是預設值」的名稱與說明（<c>WHERE Name = 舊值</c>），管理員自己改過的不會被覆蓋。
        /// </summary>
        private static readonly (string Code, string OldName, string NewName, string OldRemark, string NewRemark)[] Renames =
        {
            ("sidebar-promotion", "宣傳推廣側欄廣告", "推廣專區側欄廣告",
                "宣傳推廣（/promotion）列表、影片與詳情頁右側欄的廣告圖片（4:3），依排序由上到下全部顯示",
                "推廣專區（/promotion）列表、影片與詳情頁右側欄的廣告圖片（4:3），依排序由上到下全部顯示"),
            ("sidebar-matching", "媒合專區側欄廣告", "媒合對接側欄廣告",
                "媒合專區（/matching）列表與詳情頁右側欄的廣告圖片（4:3），依排序由上到下全部顯示",
                "媒合對接（/matching）列表與詳情頁右側欄的廣告圖片（4:3），依排序由上到下全部顯示"),
            ("sidebar-support", "輔助資源側欄廣告", "本計畫補助側欄廣告",
                "輔助資源（/support）右側欄下方的廣告圖片（4:3），依排序由上到下全部顯示",
                "本計畫補助（/support）右側欄下方的廣告圖片（4:3），依排序由上到下全部顯示"),
            ("sidebar-support-tutoring", "輔助資源側欄「產業輔導」導流", "本計畫補助側欄「產業輔導」導流",
                "輔助資源（/support）右側欄上方「產業輔導」標題下的導流圖片（4:3），通常放產業輔導相關活動",
                "本計畫補助（/support）右側欄上方「產業輔導」標題下的導流圖片（4:3），通常放產業輔導相關活動；與「產業輔導側欄廣告」不同，那個是產業輔導頁自己的右側欄"),
            ("support-top", "輔助資源頂部輪播", "本計畫補助頂部輪播",
                "輔助資源（/support）頁最上方輪播，依排序輪播所有上架中的 Banner",
                "本計畫補助（/support）頁最上方輪播，依排序輪播所有上架中的 Banner"),
        };

        private static void Rename(MigrationBuilder migrationBuilder, string code, string fromName, string toName, string fromRemark, string toRemark)
        {
            migrationBuilder.Sql($"""
                UPDATE "BannerPositions" SET "Name" = '{toName}' WHERE "Code" = '{code}' AND "Name" = '{fromName}';
                UPDATE "BannerPositions" SET "Remark" = '{toRemark}' WHERE "Code" = '{code}' AND "Remark" = '{fromRemark}';
                """);
        }
    }
}
