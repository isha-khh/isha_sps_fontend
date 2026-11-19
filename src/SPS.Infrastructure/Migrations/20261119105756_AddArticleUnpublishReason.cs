using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SPS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddArticleUnpublishReason : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "UnpublishReason",
                table: "SuccessCases",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UnpublishReason",
                table: "Questions",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UnpublishReason",
                table: "News",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "UnpublishReason",
                table: "SuccessCases");

            migrationBuilder.DropColumn(
                name: "UnpublishReason",
                table: "Questions");

            migrationBuilder.DropColumn(
                name: "UnpublishReason",
                table: "News");
        }
    }
}
