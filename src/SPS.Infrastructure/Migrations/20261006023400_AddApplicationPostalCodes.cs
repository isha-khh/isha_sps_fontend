using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SPS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddApplicationPostalCodes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CompanyPostalCode",
                table: "MemberApplication",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FactoryPostalCode",
                table: "MemberApplication",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CompanyPostalCode",
                table: "MemberApplication");

            migrationBuilder.DropColumn(
                name: "FactoryPostalCode",
                table: "MemberApplication");
        }
    }
}
