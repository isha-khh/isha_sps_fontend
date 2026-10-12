using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SPS.Domain.Entities;

namespace SPS.Infrastructure.Data.Configurations;

public class MemberNotificationConfiguration : IEntityTypeConfiguration<MemberNotification>
{
    public void Configure(EntityTypeBuilder<MemberNotification> builder)
    {
        // 收件匣只會用會員 Id 查（列表依時間排序、未讀數），這個索引涵蓋這兩種查詢
        builder.HasIndex(n => new { n.MemberId, n.IsRead, n.CreatedTime });
    }
}
