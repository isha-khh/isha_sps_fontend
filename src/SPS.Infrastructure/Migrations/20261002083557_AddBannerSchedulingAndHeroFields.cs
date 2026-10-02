using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SPS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddBannerSchedulingAndHeroFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ButtonText",
                table: "Banners",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "Banners",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "EndDate",
                table: "Banners",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Ordinal",
                table: "Banners",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<bool>(
                name: "Published",
                table: "Banners",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<string>(
                name: "SecondaryButtonText",
                table: "Banners",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SecondaryLinkUrl",
                table: "Banners",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "StartDate",
                table: "Banners",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Subtitle",
                table: "Banners",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Title",
                table: "Banners",
                type: "text",
                nullable: true);

            // 預建兩個固定版位（已存在同代碼就不重複建）。DataMode=0（Normal）；Width/Height 是建議的
            // 圖片尺寸（公告輪播對應現有 1400x500 版型，首頁主視覺圖現行為 1486x1073）。
            migrationBuilder.Sql(@"
                INSERT INTO ""BannerPositions"" (""Code"", ""Name"", ""DataMode"", ""Width"", ""Height"", ""Remark"", ""CreatedTime"", ""UpdatedTime"")
                SELECT 'home-hero', '首頁主視覺', 0, 1486, 1073, '首頁最上方主視覺，只顯示排序第一筆上架中的 Banner', now(), now()
                WHERE NOT EXISTS (SELECT 1 FROM ""BannerPositions"" WHERE ""Code"" = 'home-hero');

                INSERT INTO ""BannerPositions"" (""Code"", ""Name"", ""DataMode"", ""Width"", ""Height"", ""Remark"", ""CreatedTime"", ""UpdatedTime"")
                SELECT 'news-top', '公告頂部輪播', 0, 1400, 500, '公告事項列表頁最上方輪播，依排序輪播所有上架中的 Banner', now(), now()
                WHERE NOT EXISTS (SELECT 1 FROM ""BannerPositions"" WHERE ""Code"" = 'news-top');
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                UPDATE ""Banners"" SET ""PositionId"" = NULL
                WHERE ""PositionId"" IN (SELECT ""Id"" FROM ""BannerPositions"" WHERE ""Code"" IN ('home-hero', 'news-top'));
                DELETE FROM ""BannerPositions"" WHERE ""Code"" IN ('home-hero', 'news-top');
            ");

            migrationBuilder.DropColumn(
                name: "ButtonText",
                table: "Banners");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "Banners");

            migrationBuilder.DropColumn(
                name: "EndDate",
                table: "Banners");

            migrationBuilder.DropColumn(
                name: "Ordinal",
                table: "Banners");

            migrationBuilder.DropColumn(
                name: "Published",
                table: "Banners");

            migrationBuilder.DropColumn(
                name: "SecondaryButtonText",
                table: "Banners");

            migrationBuilder.DropColumn(
                name: "SecondaryLinkUrl",
                table: "Banners");

            migrationBuilder.DropColumn(
                name: "StartDate",
                table: "Banners");

            migrationBuilder.DropColumn(
                name: "Subtitle",
                table: "Banners");

            migrationBuilder.DropColumn(
                name: "Title",
                table: "Banners");
        }
    }
}
