using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Pgvector;
using SPS.Domain.Entities;

namespace SPS.Infrastructure.Data.Configurations;

public class ContentEmbeddingConfiguration : IEntityTypeConfiguration<ContentEmbedding>
{
    /// <summary>
    /// 向量欄位固定維度。qwen3-embedding 原生輸出 4096 維，超過 pgvector HNSW/IVFFlat
    /// 索引上限（2000 維），改用 LiteLLM 支援的 Matryoshka 截斷（dimensions 參數）取 1024 維，
    /// 兼顧可索引性與語意品質（已用平台真實資料實測 1024 維與原生 4096 維的排序品質差異可接受，
    /// 詳見 docs/設計/AI向量媒合搜尋設計.md §2.2）。
    /// </summary>
    public const int EmbeddingDimension = 1024;

    public void Configure(EntityTypeBuilder<ContentEmbedding> builder)
    {
        builder.ToTable("ContentEmbedding");

        // 同一來源同一模型只會有一筆記錄（換模型會產生新記錄，不覆蓋舊維度的資料）
        builder.HasIndex(x => new { x.SourceType, x.SourceId, x.Model }).IsUnique();
        builder.HasIndex(x => x.Status);

        builder.Property(x => x.SourceId).IsRequired().HasMaxLength(64);
        builder.Property(x => x.SourceTextHash).IsRequired().HasMaxLength(64);
        builder.Property(x => x.Model).IsRequired().HasMaxLength(100);
        builder.Property(x => x.LastError).HasMaxLength(2000);

        // Domain 層維持 float[]（不依賴 Pgvector，保持 Domain 不含持久化細節），
        // 這裡轉換成 pgvector 的 Vector 型別，欄位型別固定為 vector(1024)。
        builder.Property(x => x.Embedding)
            .HasColumnType($"vector({EmbeddingDimension})")
            .HasConversion(
                v => v == null ? null : new Vector(v),
                v => v == null ? null : v.ToArray(),
                new ValueComparer<float[]?>(
                    (a, b) => (a == null && b == null) || (a != null && b != null && a.SequenceEqual(b)),
                    v => v == null ? 0 : v.Aggregate(0, (h, x) => HashCode.Combine(h, x)),
                    v => v == null ? null : v.ToArray()));

        // 資料量小（企業/需求筆數千筆等級）暫不建 HNSW 索引，直接全表掃描即可，
        // 詳見 docs/設計/AI向量媒合搜尋設計.md §5（原設計預留，實際先不建，等資料量成長再評估）
    }
}
