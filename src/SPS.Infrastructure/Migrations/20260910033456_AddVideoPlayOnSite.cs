using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SPS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddVideoPlayOnSite : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // defaultValue: true（不是 EF Core 預設幫忙填的 false）——已經存在的影片
            // 資料要沿用「加這個欄位之前」的行為（一律嵌入播放），不能因為加了
            // 這個欄位讓舊資料全部變成「導向來源」。
            migrationBuilder.AddColumn<bool>(
                name: "PlayOnSite",
                table: "Videos",
                type: "boolean",
                nullable: false,
                defaultValue: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PlayOnSite",
                table: "Videos");
        }
    }
}
