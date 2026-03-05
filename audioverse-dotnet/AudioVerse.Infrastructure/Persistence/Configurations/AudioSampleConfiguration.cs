using AudioVerse.Domain.Entities.Editor;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations;

/// <summary>EF configuration for AudioSample.</summary>
public class AudioSampleConfiguration : IEntityTypeConfiguration<AudioSample>
{
    public void Configure(EntityTypeBuilder<AudioSample> builder)
    {
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Bpm).HasPrecision(10, 2);
    }
}
