using AudioVerse.Domain.Entities.Karaoke.Campaigns;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations;

public class PlayerProgressConfiguration : IEntityTypeConfiguration<PlayerProgress>
{
    public void Configure(EntityTypeBuilder<PlayerProgress> builder)
    {
        builder.HasIndex(p => new { p.PlayerId, p.Category }).IsUnique();
    }
}
