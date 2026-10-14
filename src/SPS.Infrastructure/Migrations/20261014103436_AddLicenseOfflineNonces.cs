using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SPS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddLicenseOfflineNonces : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "LicenseOfflineNonces",
                columns: table => new
                {
                    Nonce = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    LicenseId = table.Column<Guid>(type: "uuid", nullable: false),
                    DeviceHash = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    CreatedTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LicenseOfflineNonces", x => x.Nonce);
                    table.ForeignKey(
                        name: "FK_LicenseOfflineNonces_Licenses_LicenseId",
                        column: x => x.LicenseId,
                        principalTable: "Licenses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_LicenseOfflineNonces_CreatedTime",
                table: "LicenseOfflineNonces",
                column: "CreatedTime");

            migrationBuilder.CreateIndex(
                name: "IX_LicenseOfflineNonces_LicenseId",
                table: "LicenseOfflineNonces",
                column: "LicenseId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "LicenseOfflineNonces");
        }
    }
}
