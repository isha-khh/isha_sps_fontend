using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SPS.Domain.Entities;

namespace SPS.Infrastructure.Data.Configurations;

public class ChatReportConfiguration : IEntityTypeConfiguration<ChatReport>
{
    public void Configure(EntityTypeBuilder<ChatReport> builder)
    {
        builder.HasIndex(r => new { r.Status, r.CreatedTime });
        builder.HasIndex(r => r.ChatRecordId);
    }
}
