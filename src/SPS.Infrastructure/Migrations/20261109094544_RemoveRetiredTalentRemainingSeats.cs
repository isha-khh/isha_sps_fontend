using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SPS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RemoveRetiredTalentRemainingSeats : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 人才培育「剩餘名額」（Meta.remainingSeats）不再維護、前台也不顯示：把舊資料裡的這個欄位清掉（只動人才培育 Section = 3）
            migrationBuilder.Sql("""
                UPDATE "News" SET "Meta" = "Meta" - 'remainingSeats'
                WHERE "Section" = 3 AND jsonb_exists("Meta", 'remainingSeats');
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // 純資料清理，不還原
        }
    }
}
