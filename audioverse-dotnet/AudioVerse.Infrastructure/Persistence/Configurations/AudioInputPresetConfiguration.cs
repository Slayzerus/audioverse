using AudioVerse.Domain.Entities.Editor;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations;

/// <summary>EF configuration for AudioInputPreset.</summary>
public class AudioInputPresetConfiguration : IEntityTypeConfiguration<AudioInputPreset>
{
    public void Configure(EntityTypeBuilder<AudioInputPreset> builder)
    {
        builder.HasMany(p => p.Layers)
            .WithOne()
            .HasForeignKey(l => l.InputPresetId);
    }
}
