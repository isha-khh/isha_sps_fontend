using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SPS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddNewsCategoryIds : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<List<int>>(
                name: "CategoryIds",
                table: "News",
                type: "integer[]",
                nullable: false,
                defaultValueSql: "'{}'::integer[]");

            // 既有內容原本只有單一分類：回填成只有一個元素的陣列，依分類篩選才不會漏掉舊資料
            migrationBuilder.Sql("""UPDATE "News" SET "CategoryIds" = ARRAY["CategoryId"] WHERE "CategoryId" IS NOT NULL;""");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CategoryIds",
                table: "News");
        }
    }
}
