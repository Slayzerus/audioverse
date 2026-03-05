using AudioVerse.Domain.Entities.Editor;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations;

/// <summary>EF configuration for AudioSection.</summary>
public class AudioSectionConfiguration : IEntityTypeConfiguration<AudioSection>
{
    public void Configure(EntityTypeBuilder<AudioSection> builder)
    {
        builder.HasMany(s => s.Layers)
            .WithOne()
            .HasForeignKey(l => l.SectionId);

        builder.HasMany(s => s.InputMappings)
            .WithOne()
            .HasForeignKey(l => l.SectionId);
    }
}
