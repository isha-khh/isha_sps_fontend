using System.Linq;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SPS.Infrastructure.Migrations
{
    /// <summary>
    /// 新增權限「軟體授權（XR）管理」（位元 46）後，把它補給原本就是「全權限」的角色。
    /// 角色的權限是建立當下存進資料庫的位元遮罩，不會因為程式裡的 <c>UserPermission.All</c> 變大而自動跟著變，
    /// 所以超級管理員角色要靠這支補上（做法同 UpgradeAdminPermissionsToRbac）。
    /// 只補給「已經擁有 46 以外所有權限」的角色；其他角色不動，要到後台角色管理自己勾選。
    /// </summary>
    public partial class GrantManageLicensesToFullAccessRoles : Migration
    {
        // 與 SPS.Domain.Enums.UserPermission 一致（migration 不引用 enum，避免日後 enum 改動讓歷史 migration 變質）
        private static readonly int[] AllBitsBeforeLicenses = { 0, 1, 2, 4, 10, 11, 20, 21, 22, 23, 24, 30, 31, 32, 33, 34, 35, 36, 37, 39, 40, 41, 42, 45, 50, 51, 52 };
        private const int ManageLicensesBit = 46;

        private static long Mask(params int[] bits) => bits.Aggregate(0L, (acc, b) => acc | (1L << b));

        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            var previousAll = Mask(AllBitsBeforeLicenses);
            var licenses = Mask(ManageLicensesBit);
            migrationBuilder.Sql($@"
                UPDATE ""Roles"" SET ""Permissions"" = ""Permissions"" | {licenses}
                WHERE (""Permissions"" & {previousAll}) = {previousAll};
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql($@"UPDATE ""Roles"" SET ""Permissions"" = ""Permissions"" & ~{Mask(ManageLicensesBit)}::bigint;");
        }
    }
}
