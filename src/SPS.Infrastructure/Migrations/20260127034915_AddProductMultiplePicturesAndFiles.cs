using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SPS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddProductMultiplePicturesAndFiles : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Files_Products_ProductId",
                table: "Files");

            migrationBuilder.DropForeignKey(
                name: "FK_Products_Categories_CategoryId",
                table: "Products");

            migrationBuilder.DropForeignKey(
                name: "FK_Products_Company_CompanyId",
                table: "Products");

            migrationBuilder.DropForeignKey(
                name: "FK_Products_Pictures_PictureId",
                table: "Products");

            migrationBuilder.DropForeignKey(
                name: "FK_Products_Products_BaseId",
                table: "Products");

            migrationBuilder.DropForeignKey(
                name: "FK_Products_StringResources_DescriptionId",
                table: "Products");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Products",
                table: "Products");

            migrationBuilder.RenameTable(
                name: "Products",
                newName: "Product");

            migrationBuilder.RenameColumn(
                name: "PictureId",
                table: "Product",
                newName: "CoverId");

            migrationBuilder.RenameIndex(
                name: "IX_Products_PictureId",
                table: "Product",
                newName: "IX_Product_CoverId");

            migrationBuilder.RenameIndex(
                name: "IX_Products_DescriptionId",
                table: "Product",
                newName: "IX_Product_DescriptionId");

            migrationBuilder.RenameIndex(
                name: "IX_Products_CompanyId",
                table: "Product",
                newName: "IX_Product_CompanyId");

            migrationBuilder.RenameIndex(
                name: "IX_Products_CategoryId",
                table: "Product",
                newName: "IX_Product_CategoryId");

            migrationBuilder.RenameIndex(
                name: "IX_Products_BaseId",
                table: "Product",
                newName: "IX_Product_BaseId");

            migrationBuilder.AddColumn<int>(
                name: "ProductId",
                table: "Pictures",
                type: "integer",
                nullable: true);

            migrationBuilder.AddPrimaryKey(
                name: "PK_Product",
                table: "Product",
                column: "Id");

            migrationBuilder.CreateIndex(
                name: "IX_Pictures_ProductId",
                table: "Pictures",
                column: "ProductId");

            migrationBuilder.AddForeignKey(
                name: "FK_Files_Product_ProductId",
                table: "Files",
                column: "ProductId",
                principalTable: "Product",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Pictures_Product_ProductId",
                table: "Pictures",
                column: "ProductId",
                principalTable: "Product",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Product_Categories_CategoryId",
                table: "Product",
                column: "CategoryId",
                principalTable: "Categories",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Product_Company_CompanyId",
                table: "Product",
                column: "CompanyId",
                principalTable: "Company",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Product_Pictures_CoverId",
                table: "Product",
                column: "CoverId",
                principalTable: "Pictures",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Product_Product_BaseId",
                table: "Product",
                column: "BaseId",
                principalTable: "Product",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Product_StringResources_DescriptionId",
                table: "Product",
                column: "DescriptionId",
                principalTable: "StringResources",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Files_Product_ProductId",
                table: "Files");

            migrationBuilder.DropForeignKey(
                name: "FK_Pictures_Product_ProductId",
                table: "Pictures");

            migrationBuilder.DropForeignKey(
                name: "FK_Product_Categories_CategoryId",
                table: "Product");

            migrationBuilder.DropForeignKey(
                name: "FK_Product_Company_CompanyId",
                table: "Product");

            migrationBuilder.DropForeignKey(
                name: "FK_Product_Pictures_CoverId",
                table: "Product");

            migrationBuilder.DropForeignKey(
                name: "FK_Product_Product_BaseId",
                table: "Product");

            migrationBuilder.DropForeignKey(
                name: "FK_Product_StringResources_DescriptionId",
                table: "Product");

            migrationBuilder.DropIndex(
                name: "IX_Pictures_ProductId",
                table: "Pictures");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Product",
                table: "Product");

            migrationBuilder.DropColumn(
                name: "ProductId",
                table: "Pictures");

            migrationBuilder.RenameTable(
                name: "Product",
                newName: "Products");

            migrationBuilder.RenameColumn(
                name: "CoverId",
                table: "Products",
                newName: "PictureId");

            migrationBuilder.RenameIndex(
                name: "IX_Product_DescriptionId",
                table: "Products",
                newName: "IX_Products_DescriptionId");

            migrationBuilder.RenameIndex(
                name: "IX_Product_CoverId",
                table: "Products",
                newName: "IX_Products_PictureId");

            migrationBuilder.RenameIndex(
                name: "IX_Product_CompanyId",
                table: "Products",
                newName: "IX_Products_CompanyId");

            migrationBuilder.RenameIndex(
                name: "IX_Product_CategoryId",
                table: "Products",
                newName: "IX_Products_CategoryId");

            migrationBuilder.RenameIndex(
                name: "IX_Product_BaseId",
                table: "Products",
                newName: "IX_Products_BaseId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Products",
                table: "Products",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Files_Products_ProductId",
                table: "Files",
                column: "ProductId",
                principalTable: "Products",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Products_Categories_CategoryId",
                table: "Products",
                column: "CategoryId",
                principalTable: "Categories",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Products_Company_CompanyId",
                table: "Products",
                column: "CompanyId",
                principalTable: "Company",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Products_Pictures_PictureId",
                table: "Products",
                column: "PictureId",
                principalTable: "Pictures",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Products_Products_BaseId",
                table: "Products",
                column: "BaseId",
                principalTable: "Products",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Products_StringResources_DescriptionId",
                table: "Products",
                column: "DescriptionId",
                principalTable: "StringResources",
                principalColumn: "Id");
        }
    }
}
