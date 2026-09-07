using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SPS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class fixproductlinlfileManager : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ProductId",
                table: "UploadedFiles",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_UploadedFiles_ProductId",
                table: "UploadedFiles",
                column: "ProductId");

            migrationBuilder.AddForeignKey(
                name: "FK_UploadedFiles_Product_ProductId",
                table: "UploadedFiles",
                column: "ProductId",
                principalTable: "Product",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_UploadedFiles_Product_ProductId",
                table: "UploadedFiles");

            migrationBuilder.DropIndex(
                name: "IX_UploadedFiles_ProductId",
                table: "UploadedFiles");

            migrationBuilder.DropColumn(
                name: "ProductId",
                table: "UploadedFiles");
        }
    }
}
