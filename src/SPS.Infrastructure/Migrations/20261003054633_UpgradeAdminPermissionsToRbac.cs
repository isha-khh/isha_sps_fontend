using System.Linq;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SPS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UpgradeAdminPermissionsToRbac : Migration
    {

        // UserPermission 位元（與 SPS.Domain.Enums.UserPermission 一致；migration 不引用 enum，避免日後 enum 改動讓歷史 migration 變質）
        private static long Bit(int n) => 1L << n;

        private static readonly long[] OldAllBits = { 0, 1, 2, 10, 20, 21, 30, 31, 32, 33, 34, 35, 36, 40, 41, 50, 51, 52 };
        // 這次新增：ViewActionLogs(4) ViewApplications(11) ViewMembers(22) ViewCompanies(23) ExportData(24)
        //          ManageBanners(37) ManageSiteContent(39) ManageMedia(42) ManageFiles(45)
        private static readonly int[] NewBits = { 4, 11, 22, 23, 24, 37, 39, 42, 45 };

        private static long Mask(params int[] bits) => bits.Aggregate(0L, (acc, b) => acc | Bit(b));

        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            var oldAll = OldAllBits.Aggregate(0L, (acc, b) => acc | Bit((int)b));
            var newAll = Mask(NewBits);

            // 1) 現有角色依「原本就能做的事」自動補上新權限，讓套用後行為不變：
            //    - 舊的「全權限」角色 → 補上全部新權限（新的 All）
            //    - 用戶／系統設定 → 檢視操作記錄；系統設定、公告管理 → 系統檔案管理
            //    - 會員／企業／產品管理 → 匯出資料
            //    - 公告管理 → 橫幅、網站內容、媒體管理（原本都掛在公告管理底下）
            //    - 客服、群發信 → 檢視會員與企業（原本任何後台帳號都看得到）
            //    「維護包含檢視」由程式在判斷時展開，不需要寫進角色
            migrationBuilder.Sql($@"
                UPDATE ""Roles"" SET ""Permissions"" = ""Permissions""
                    | CASE WHEN (""Permissions"" & {oldAll}) = {oldAll} THEN {newAll} ELSE 0 END
                    | CASE WHEN (""Permissions"" & {Mask(0, 2)}) <> 0 THEN {Mask(4)} ELSE 0 END
                    | CASE WHEN (""Permissions"" & {Mask(2, 32)}) <> 0 THEN {Mask(45)} ELSE 0 END
                    | CASE WHEN (""Permissions"" & {Mask(20, 21, 30)}) <> 0 THEN {Mask(24)} ELSE 0 END
                    | CASE WHEN (""Permissions"" & {Mask(32)}) <> 0 THEN {Mask(37, 39, 42)} ELSE 0 END
                    | CASE WHEN (""Permissions"" & {Mask(41, 50)}) <> 0 THEN {Mask(22, 23)} ELSE 0 END;
            ");

            // 2) 範本角色（名稱已存在就不動，避免蓋掉你自己建的同名角色）
            SeedRole(migrationBuilder, "超級管理員", "擁有全部權限", oldAll | newAll);
            SeedRole(migrationBuilder, "內容編輯", "公告、橫幅、網站內容、媒體、知識庫、分類與檔案上傳",
                Mask(32, 37, 39, 42, 33, 34, 35, 36, 45));
            SeedRole(migrationBuilder, "審核員", "會員申請審核（含評分），可檢視會員與企業",
                Mask(10, 22, 23));
            SeedRole(migrationBuilder, "客服", "即時客服，可檢視會員與企業",
                Mask(41, 22, 23));
            SeedRole(migrationBuilder, "行銷人員", "群發信、寄信紀錄與信件範本，可檢視會員與企業作為收件人",
                Mask(50, 51, 52, 22, 23));
        }

        private static void SeedRole(MigrationBuilder migrationBuilder, string name, string description, long permissions)
        {
            migrationBuilder.Sql($@"
                INSERT INTO ""Roles"" (""Id"", ""Name"", ""DataMode"", ""Description"", ""Permissions"", ""CreatedTime"", ""UpdatedTime"")
                SELECT gen_random_uuid(), '{name}', 0, '{description}', {permissions}, now(), now()
                WHERE NOT EXISTS (SELECT 1 FROM ""Roles"" WHERE ""Name"" = '{name}');
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // 範本角色：沒有任何使用者指派才刪（有人用就保留，只拿掉新權限位元）
            migrationBuilder.Sql(@"
                DELETE FROM ""Roles"" r
                WHERE r.""Name"" IN ('超級管理員', '內容編輯', '審核員', '客服', '行銷人員')
                  AND NOT EXISTS (SELECT 1 FROM ""UserRole"" ur WHERE ur.""RoleId"" = r.""Id"");
            ");
            migrationBuilder.Sql($@"UPDATE ""Roles"" SET ""Permissions"" = ""Permissions"" & ~{Mask(NewBits)}::bigint;");
        }
    }
}
