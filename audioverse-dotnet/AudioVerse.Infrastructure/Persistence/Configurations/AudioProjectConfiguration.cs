using AudioVerse.Domain.Entities.Editor;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations;

/// <summary>EF configuration for AudioProject.</summary>
public class AudioProjectConfiguration : IEntityTypeConfiguration<AudioProject>
{
    public void Configure(EntityTypeBuilder<AudioProject> builder)
    {
        builder.HasMany(ap => ap.Sections)
            .WithOne()
            .HasForeignKey(s => s.ProjectId);
    }
}
