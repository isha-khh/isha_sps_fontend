using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace SPS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAnalyticsDimensions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AnalyticsDailyMetric",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Date = table.Column<DateOnly>(type: "date", nullable: false),
                    ActiveUsers = table.Column<int>(type: "integer", nullable: false),
                    NewUsers = table.Column<int>(type: "integer", nullable: false),
                    ScreenPageViews = table.Column<int>(type: "integer", nullable: false),
                    Sessions = table.Column<int>(type: "integer", nullable: false),
                    AverageEngagementTime = table.Column<double>(type: "double precision", nullable: false),
                    BounceRate = table.Column<double>(type: "double precision", nullable: false),
                    ScreenPageViewsPerSession = table.Column<double>(type: "double precision", nullable: false),
                    EventCount = table.Column<int>(type: "integer", nullable: false),
                    CreatedTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AnalyticsDailyMetric", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AnalyticsDimensionStatistic",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Date = table.Column<DateOnly>(type: "date", nullable: false),
                    DimensionType = table.Column<int>(type: "integer", nullable: false),
                    DimensionValue = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    MetricValue = table.Column<int>(type: "integer", nullable: false),
                    CreatedTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AnalyticsDimensionStatistic", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AnalyticsDailyMetric_Date",
                table: "AnalyticsDailyMetric",
                column: "Date",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AnalyticsDimensionStatistic_Date_DimensionType_DimensionVal~",
                table: "AnalyticsDimensionStatistic",
                columns: new[] { "Date", "DimensionType", "DimensionValue" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AnalyticsDailyMetric");

            migrationBuilder.DropTable(
                name: "AnalyticsDimensionStatistic");
        }
    }
}
