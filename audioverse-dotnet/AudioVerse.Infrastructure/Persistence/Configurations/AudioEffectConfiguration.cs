using AudioVerse.Domain.Entities.Editor;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations;

/// <summary>EF configuration for AudioEffect.</summary>
public class AudioEffectConfiguration : IEntityTypeConfiguration<AudioEffect>
{
    public void Configure(EntityTypeBuilder<AudioEffect> builder)
    {
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Type).HasConversion<int>();
    }
}
