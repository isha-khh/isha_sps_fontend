using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SPS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddBadgeColorsToCategoryAndTag : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "BadgeBorderColor",
                table: "Tags",
                type: "character varying(7)",
                maxLength: 7,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BadgeColor",
                table: "Tags",
                type: "character varying(7)",
                maxLength: 7,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BadgeTextColor",
                table: "Tags",
                type: "character varying(7)",
                maxLength: 7,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BadgeBorderColor",
                table: "Categories",
                type: "character varying(7)",
                maxLength: 7,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BadgeColor",
                table: "Categories",
                type: "character varying(7)",
                maxLength: 7,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BadgeTextColor",
                table: "Categories",
                type: "character varying(7)",
                maxLength: 7,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BadgeBorderColor",
                table: "Tags");

            migrationBuilder.DropColumn(
                name: "BadgeColor",
                table: "Tags");

            migrationBuilder.DropColumn(
                name: "BadgeTextColor",
                table: "Tags");

            migrationBuilder.DropColumn(
                name: "BadgeBorderColor",
                table: "Categories");

            migrationBuilder.DropColumn(
                name: "BadgeColor",
                table: "Categories");

            migrationBuilder.DropColumn(
                name: "BadgeTextColor",
                table: "Categories");
        }
    }
}
