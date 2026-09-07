using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SPS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPhoneFieldsToMemberApplication : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "ContactPhone",
                table: "MemberApplication",
                newName: "Phone");

            migrationBuilder.AddColumn<string>(
                name: "Extension",
                table: "MemberApplication",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MobilePhone",
                table: "MemberApplication",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Extension",
                table: "MemberApplication");

            migrationBuilder.DropColumn(
                name: "MobilePhone",
                table: "MemberApplication");

            migrationBuilder.RenameColumn(
                name: "Phone",
                table: "MemberApplication",
                newName: "ContactPhone");
        }
    }
}
