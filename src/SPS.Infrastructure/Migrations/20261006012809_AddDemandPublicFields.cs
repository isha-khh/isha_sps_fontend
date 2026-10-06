using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SPS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddDemandPublicFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<List<Guid>>(
                name: "AttachmentFileIds",
                table: "Demands",
                type: "uuid[]",
                nullable: false,
                defaultValueSql: "'{}'::uuid[]");

            migrationBuilder.AddColumn<string>(
                name: "Location",
                table: "Demands",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PublicSummary",
                table: "Demands",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AttachmentFileIds",
                table: "Demands");

            migrationBuilder.DropColumn(
                name: "Location",
                table: "Demands");

            migrationBuilder.DropColumn(
                name: "PublicSummary",
                table: "Demands");
        }
    }
}
