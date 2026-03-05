using AudioVerse.Domain.Entities.Editor;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations;

/// <summary>EF configuration for AudioLayerEffect.</summary>
public class AudioLayerEffectConfiguration : IEntityTypeConfiguration<AudioLayerEffect>
{
    public void Configure(EntityTypeBuilder<AudioLayerEffect> builder)
    {
        builder.HasKey(e => e.Id);
        builder.HasOne(e => e.Layer).WithMany().HasForeignKey(e => e.LayerId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(e => e.Effect).WithMany().HasForeignKey(e => e.EffectId).OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(e => new { e.LayerId, e.Order }).HasDatabaseName("IDX_LayerEffect_Order");
    }
}
