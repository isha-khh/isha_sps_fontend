using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using System.Text.Json;
using SPS.Domain.Entities;

namespace SPS.Infrastructure.Data.Configurations;

public class NewsConfiguration : IEntityTypeConfiguration<News>
{
    public void Configure(EntityTypeBuilder<News> builder)
    {
        builder.ToTable("News");

        // Meta 是 Dictionary<string,string>；Npgsql 讀寫 Dictionary 的 jsonb 需要啟用動態 JSON（要改資料來源設定、
        // 連 pgvector 也會跟著動），所以這裡自己轉成 JSON 字串存進 jsonb 欄位。ValueComparer 讓 EF 能偵測字典內容的變更
        builder.Property(n => n.Meta)
            .HasColumnType("jsonb")
            .HasDefaultValueSql("'{}'::jsonb")
            .HasConversion(
                v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                v => string.IsNullOrEmpty(v) ? new Dictionary<string, string>() : JsonSerializer.Deserialize<Dictionary<string, string>>(v, (JsonSerializerOptions?)null) ?? new Dictionary<string, string>(),
                new ValueComparer<Dictionary<string, string>>(
                    (a, b) => JsonSerializer.Serialize(a, (JsonSerializerOptions?)null) == JsonSerializer.Serialize(b, (JsonSerializerOptions?)null),
                    v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null).GetHashCode(),
                    v => new Dictionary<string, string>(v)));

        // 多選分類：integer[]，既有資料由遷移用 CategoryId 回填
        builder.Property(n => n.CategoryIds)
            .HasColumnType("integer[]")
            .HasDefaultValueSql("'{}'::integer[]");

        builder.Property(n => n.IndustryIds)
            .HasColumnType("integer[]")
            .HasDefaultValueSql("'{}'::integer[]");

        builder.HasOne(n => n.Title)
            .WithMany(mt => mt.NewsTitles)
            .HasForeignKey(n => n.TitleId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasOne(n => n.Introduction)
            .WithMany(mt => mt.NewsIntroductions)
            .HasForeignKey(n => n.IntroductionId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasOne(n => n.Content)
            .WithMany(mt => mt.NewsContents)
            .HasForeignKey(n => n.ContentId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasOne(n => n.Picture)
            .WithMany(mi => mi.News)
            .HasForeignKey(n => n.PictureId)
            .OnDelete(DeleteBehavior.NoAction);
    }
}
