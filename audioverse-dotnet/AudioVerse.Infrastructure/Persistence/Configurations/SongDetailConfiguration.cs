using AudioVerse.Domain.Entities.Audio;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations;

/// <summary>EF configuration for SongDetail.</summary>
public class SongDetailConfiguration : IEntityTypeConfiguration<SongDetail>
{
    public void Configure(EntityTypeBuilder<SongDetail> builder)
    {
        builder.ToTable("LibrarySongDetails");
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Type).HasConversion<int>();
    }
}
