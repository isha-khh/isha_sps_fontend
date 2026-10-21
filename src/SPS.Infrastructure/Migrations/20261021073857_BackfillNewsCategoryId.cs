using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SPS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class BackfillNewsCategoryId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // issue #62：後台每次編輯公告，NewsService 會把主分類 CategoryId 清成 null（CategoryIds 還在）。
            // 這裡把「CategoryId 是空的、CategoryIds 有值」的公告，主分類補回 CategoryIds 的第一個（該分類必須還存在）。
            // 純資料 migration（沒有 schema 變更）；重跑安全
            migrationBuilder.Sql(@"
                UPDATE ""News"" n
                SET ""CategoryId"" = n.""CategoryIds""[1]
                WHERE n.""CategoryId"" IS NULL
                  AND cardinality(n.""CategoryIds"") > 0
                  AND EXISTS (SELECT 1 FROM ""Categories"" c WHERE c.""Id"" = n.""CategoryIds""[1]);
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // 資料修復，不還原
        }
    }
}
