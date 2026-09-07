using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SPS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class changeReviewertoUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_MemberApplication_Members_ReviewerId",
                table: "MemberApplication");

            migrationBuilder.AddForeignKey(
                name: "FK_MemberApplication_Users_ReviewerId",
                table: "MemberApplication",
                column: "ReviewerId",
                principalTable: "Users",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_MemberApplication_Users_ReviewerId",
                table: "MemberApplication");

            migrationBuilder.AddForeignKey(
                name: "FK_MemberApplication_Members_ReviewerId",
                table: "MemberApplication",
                column: "ReviewerId",
                principalTable: "Members",
                principalColumn: "Id");
        }
    }
}
