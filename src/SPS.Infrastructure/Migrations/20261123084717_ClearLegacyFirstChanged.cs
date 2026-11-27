using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SPS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class ClearLegacyFirstChanged : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 「要求下次登入修改密碼」（FirstChanged = false）以前前台完全不處理，審核通過的新會員全部是 false。
            // 前台開始處理之後，如果不清掉，所有還沒改過密碼的既有會員下次用密碼登入都會被強制改密碼。
            // 以前這個旗標從來沒有生效過，所以全部歸零（改成「不需要」）；之後管理員要強制誰再手動設定。
            migrationBuilder.Sql("UPDATE \"Members\" SET \"FirstChanged\" = TRUE WHERE \"FirstChanged\" = FALSE;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // 資料修正，無法還原（不知道原本哪些會員是 false）
        }
    }
}
