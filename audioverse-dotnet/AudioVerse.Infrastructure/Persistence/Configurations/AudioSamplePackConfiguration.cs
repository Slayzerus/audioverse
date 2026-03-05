using AudioVerse.Domain.Entities.Editor;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations;

/// <summary>EF configuration for AudioSamplePack.</summary>
public class AudioSamplePackConfiguration : IEntityTypeConfiguration<AudioSamplePack>
{
    public void Configure(EntityTypeBuilder<AudioSamplePack> builder)
    {
        builder.HasKey(e => e.Id);
        builder.HasMany(e => e.Samples).WithOne(s => s.Pack).HasForeignKey(s => s.PackId).OnDelete(DeleteBehavior.Cascade);
    }
}
