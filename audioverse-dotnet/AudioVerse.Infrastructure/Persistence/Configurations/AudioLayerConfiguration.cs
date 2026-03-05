using AudioVerse.Domain.Entities.Editor;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations;

/// <summary>EF configuration for AudioLayer.</summary>
public class AudioLayerConfiguration : IEntityTypeConfiguration<AudioLayer>
{
    public void Configure(EntityTypeBuilder<AudioLayer> builder)
    {
        builder.HasMany(l => l.Items)
            .WithOne()
            .HasForeignKey(e => e.LayerId);

        builder.HasMany(l => l.InputMappings)
            .WithOne()
            .HasForeignKey(e => e.LayerId);

        builder.HasOne(l => l.AudioClip)
            .WithMany()
            .HasForeignKey(e => e.AudioClipId);
    }
}
