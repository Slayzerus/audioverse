using AudioVerse.Domain.Entities.Editor;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations;

/// <summary>EF configuration for AudioClip.</summary>
public class AudioClipConfiguration : IEntityTypeConfiguration<AudioClip>
{
    public void Configure(EntityTypeBuilder<AudioClip> builder)
    {
        builder.HasMany(l => l.Tags)
            .WithOne()
            .HasForeignKey(e => e.AudioClipId);
    }
}
