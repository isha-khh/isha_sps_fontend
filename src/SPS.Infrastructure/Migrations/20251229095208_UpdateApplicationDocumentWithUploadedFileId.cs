using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SPS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UpdateApplicationDocumentWithUploadedFileId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "UploadedFileId",
                table: "ApplicationDocument",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ApplicationDocument_UploadedFileId",
                table: "ApplicationDocument",
                column: "UploadedFileId");

            migrationBuilder.AddForeignKey(
                name: "FK_ApplicationDocument_UploadedFiles_UploadedFileId",
                table: "ApplicationDocument",
                column: "UploadedFileId",
                principalTable: "UploadedFiles",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ApplicationDocument_UploadedFiles_UploadedFileId",
                table: "ApplicationDocument");

            migrationBuilder.DropIndex(
                name: "IX_ApplicationDocument_UploadedFileId",
                table: "ApplicationDocument");

            migrationBuilder.DropColumn(
                name: "UploadedFileId",
                table: "ApplicationDocument");
        }
    }
}
