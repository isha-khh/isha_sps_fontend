using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SPS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddApplicationCompanyProfile : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AwardNote",
                table: "MemberApplication",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CompanyCity",
                table: "MemberApplication",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CompanyDistrict",
                table: "MemberApplication",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CompanyPhone",
                table: "MemberApplication",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EstablishmentDate",
                table: "MemberApplication",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FactoryAddress",
                table: "MemberApplication",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FactoryCity",
                table: "MemberApplication",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FactoryDistrict",
                table: "MemberApplication",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FactoryName",
                table: "MemberApplication",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Introduction",
                table: "MemberApplication",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OrgUrl",
                table: "MemberApplication",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "Revenue",
                table: "MemberApplication",
                type: "numeric",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Subject",
                table: "MemberApplication",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<List<int>>(
                name: "TagIds",
                table: "MemberApplication",
                type: "integer[]",
                nullable: false,
                defaultValueSql: "\'{}\'::integer[]");

            migrationBuilder.AddColumn<string>(
                name: "FactoryAddress",
                table: "Company",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FactoryName",
                table: "Company",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AwardNote",
                table: "MemberApplication");

            migrationBuilder.DropColumn(
                name: "CompanyCity",
                table: "MemberApplication");

            migrationBuilder.DropColumn(
                name: "CompanyDistrict",
                table: "MemberApplication");

            migrationBuilder.DropColumn(
                name: "CompanyPhone",
                table: "MemberApplication");

            migrationBuilder.DropColumn(
                name: "EstablishmentDate",
                table: "MemberApplication");

            migrationBuilder.DropColumn(
                name: "FactoryAddress",
                table: "MemberApplication");

            migrationBuilder.DropColumn(
                name: "FactoryCity",
                table: "MemberApplication");

            migrationBuilder.DropColumn(
                name: "FactoryDistrict",
                table: "MemberApplication");

            migrationBuilder.DropColumn(
                name: "FactoryName",
                table: "MemberApplication");

            migrationBuilder.DropColumn(
                name: "Introduction",
                table: "MemberApplication");

            migrationBuilder.DropColumn(
                name: "OrgUrl",
                table: "MemberApplication");

            migrationBuilder.DropColumn(
                name: "Revenue",
                table: "MemberApplication");

            migrationBuilder.DropColumn(
                name: "Subject",
                table: "MemberApplication");

            migrationBuilder.DropColumn(
                name: "TagIds",
                table: "MemberApplication");

            migrationBuilder.DropColumn(
                name: "FactoryAddress",
                table: "Company");

            migrationBuilder.DropColumn(
                name: "FactoryName",
                table: "Company");
        }
    }
}
