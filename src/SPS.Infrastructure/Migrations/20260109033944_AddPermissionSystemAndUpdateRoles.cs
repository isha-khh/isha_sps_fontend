using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SPS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPermissionSystemAndUpdateRoles : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PermissionValue",
                table: "Roles");

            migrationBuilder.AddColumn<long>(
                name: "Permissions",
                table: "Roles",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.AddColumn<int>(
                name: "MemberPosition",
                table: "Members",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<long>(
                name: "Permissions",
                table: "Members",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Permissions",
                table: "Roles");

            migrationBuilder.DropColumn(
                name: "MemberPosition",
                table: "Members");

            migrationBuilder.DropColumn(
                name: "Permissions",
                table: "Members");

            migrationBuilder.AddColumn<string>(
                name: "PermissionValue",
                table: "Roles",
                type: "text",
                nullable: true);
        }
    }
}
