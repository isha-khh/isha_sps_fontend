using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace SPS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UpdateSchemaWithNewEntitiesAndFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Attributes_Categories_CategoryId",
                table: "Attributes");

            migrationBuilder.AlterColumn<int>(
                name: "CategoryId",
                table: "Attributes",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AddColumn<short>(
                name: "DataMode",
                table: "Attributes",
                type: "smallint",
                nullable: false,
                defaultValue: (short)0);

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "Attributes",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Type",
                table: "Attributes",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "CoverImageUrl",
                table: "About",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "EndDate",
                table: "About",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Excerpt",
                table: "About",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Icon",
                table: "About",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ImageCount",
                table: "About",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ImageUrl",
                table: "About",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "About",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsPublished",
                table: "About",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "LinkUrl",
                table: "About",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "OpenInNewTab",
                table: "About",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "Slug",
                table: "About",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "StartDate",
                table: "About",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Subject",
                table: "About",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Url",
                table: "About",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Variables",
                table: "About",
                type: "text",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Mous",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Title = table.Column<string>(type: "text", nullable: false),
                    CompanyId = table.Column<Guid>(type: "uuid", nullable: false),
                    SignDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    StartDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    EndDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    DescriptionId = table.Column<int>(type: "integer", nullable: true),
                    Attachments = table.Column<string>(type: "text", nullable: true),
                    DataMode = table.Column<short>(type: "smallint", nullable: false),
                    CreatedTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Mous", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Mous_Company_CompanyId",
                        column: x => x.CompanyId,
                        principalTable: "Company",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Mous_MultilingualTexts_DescriptionId",
                        column: x => x.DescriptionId,
                        principalTable: "MultilingualTexts",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "SuccessCases",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TitleId = table.Column<int>(type: "integer", nullable: false),
                    CompanyName = table.Column<string>(type: "text", nullable: false),
                    Industry = table.Column<string>(type: "text", nullable: false),
                    CoverImageUrl = table.Column<string>(type: "text", nullable: true),
                    SummaryId = table.Column<int>(type: "integer", nullable: false),
                    ContentId = table.Column<int>(type: "integer", nullable: false),
                    Tags = table.Column<string>(type: "text", nullable: true),
                    PublishedDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsPublished = table.Column<bool>(type: "boolean", nullable: false),
                    ViewCount = table.Column<int>(type: "integer", nullable: false),
                    DataMode = table.Column<short>(type: "smallint", nullable: false),
                    CreatedTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SuccessCases", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SuccessCases_MultilingualTexts_ContentId",
                        column: x => x.ContentId,
                        principalTable: "MultilingualTexts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SuccessCases_MultilingualTexts_SummaryId",
                        column: x => x.SummaryId,
                        principalTable: "MultilingualTexts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SuccessCases_MultilingualTexts_TitleId",
                        column: x => x.TitleId,
                        principalTable: "MultilingualTexts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Mous_CompanyId",
                table: "Mous",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_Mous_DescriptionId",
                table: "Mous",
                column: "DescriptionId");

            migrationBuilder.CreateIndex(
                name: "IX_SuccessCases_ContentId",
                table: "SuccessCases",
                column: "ContentId");

            migrationBuilder.CreateIndex(
                name: "IX_SuccessCases_SummaryId",
                table: "SuccessCases",
                column: "SummaryId");

            migrationBuilder.CreateIndex(
                name: "IX_SuccessCases_TitleId",
                table: "SuccessCases",
                column: "TitleId");

            migrationBuilder.AddForeignKey(
                name: "FK_Attributes_Categories_CategoryId",
                table: "Attributes",
                column: "CategoryId",
                principalTable: "Categories",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Attributes_Categories_CategoryId",
                table: "Attributes");

            migrationBuilder.DropTable(
                name: "Mous");

            migrationBuilder.DropTable(
                name: "SuccessCases");

            migrationBuilder.DropColumn(
                name: "DataMode",
                table: "Attributes");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "Attributes");

            migrationBuilder.DropColumn(
                name: "Type",
                table: "Attributes");

            migrationBuilder.DropColumn(
                name: "CoverImageUrl",
                table: "About");

            migrationBuilder.DropColumn(
                name: "EndDate",
                table: "About");

            migrationBuilder.DropColumn(
                name: "Excerpt",
                table: "About");

            migrationBuilder.DropColumn(
                name: "Icon",
                table: "About");

            migrationBuilder.DropColumn(
                name: "ImageCount",
                table: "About");

            migrationBuilder.DropColumn(
                name: "ImageUrl",
                table: "About");

            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "About");

            migrationBuilder.DropColumn(
                name: "IsPublished",
                table: "About");

            migrationBuilder.DropColumn(
                name: "LinkUrl",
                table: "About");

            migrationBuilder.DropColumn(
                name: "OpenInNewTab",
                table: "About");

            migrationBuilder.DropColumn(
                name: "Slug",
                table: "About");

            migrationBuilder.DropColumn(
                name: "StartDate",
                table: "About");

            migrationBuilder.DropColumn(
                name: "Subject",
                table: "About");

            migrationBuilder.DropColumn(
                name: "Url",
                table: "About");

            migrationBuilder.DropColumn(
                name: "Variables",
                table: "About");

            migrationBuilder.AlterColumn<int>(
                name: "CategoryId",
                table: "Attributes",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Attributes_Categories_CategoryId",
                table: "Attributes",
                column: "CategoryId",
                principalTable: "Categories",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
