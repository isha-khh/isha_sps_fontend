using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SPS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddNewsIndustryIds : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<List<int>>(
                name: "IndustryIds",
                table: "News",
                type: "integer[]",
                nullable: false,
                defaultValueSql: "'{}'::integer[]");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IndustryIds",
                table: "News");
        }
    }
}
