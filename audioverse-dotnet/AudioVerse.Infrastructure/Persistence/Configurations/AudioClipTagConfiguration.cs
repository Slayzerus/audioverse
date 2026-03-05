using AudioVerse.Domain.Entities.Editor;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations;

/// <summary>EF configuration for AudioClipTag.</summary>
public class AudioClipTagConfiguration : IEntityTypeConfiguration<AudioClipTag>
{
    public void Configure(EntityTypeBuilder<AudioClipTag> builder)
    {
        builder.HasKey(ps => new { ps.AudioClipId, ps.Tag });
    }
}
