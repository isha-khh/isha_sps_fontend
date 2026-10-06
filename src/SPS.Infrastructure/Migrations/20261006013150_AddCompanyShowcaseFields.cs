using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SPS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCompanyShowcaseFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<List<Guid>>(
                name: "AwardImageFileIds",
                table: "Company",
                type: "uuid[]",
                nullable: false,
                defaultValueSql: "\'{}\'::uuid[]");

            migrationBuilder.AddColumn<string>(
                name: "CooperationNote",
                table: "Company",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<List<Guid>>(
                name: "ProductImageFileIds",
                table: "Company",
                type: "uuid[]",
                nullable: false,
                defaultValueSql: "\'{}\'::uuid[]");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AwardImageFileIds",
                table: "Company");

            migrationBuilder.DropColumn(
                name: "CooperationNote",
                table: "Company");

            migrationBuilder.DropColumn(
                name: "ProductImageFileIds",
                table: "Company");
        }
    }
}
