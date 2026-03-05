using AudioVerse.Domain.Entities.Audio;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations;

public class DanceStyleConfiguration : IEntityTypeConfiguration<DanceStyle>
{
    public void Configure(EntityTypeBuilder<DanceStyle> builder)
    {
        builder.ToTable("DanceStyles");
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Name).IsRequired().HasMaxLength(100);
        builder.Property(e => e.NamePl).HasMaxLength(100);
        builder.Property(e => e.Category).IsRequired().HasMaxLength(50);
        builder.Property(e => e.TimeSignature).HasMaxLength(10);
        builder.Property(e => e.RhythmPattern).HasMaxLength(100);
        builder.Property(e => e.Description).HasMaxLength(500);
        builder.HasIndex(e => e.Name).IsUnique();
    }
}
