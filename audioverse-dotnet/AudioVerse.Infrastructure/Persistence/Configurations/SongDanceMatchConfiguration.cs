using AudioVerse.Domain.Entities.Audio;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations;

public class SongDanceMatchConfiguration : IEntityTypeConfiguration<SongDanceMatch>
{
    public void Configure(EntityTypeBuilder<SongDanceMatch> builder)
    {
        builder.ToTable("SongDanceMatches");
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Confidence).HasPrecision(5, 2);
        builder.Property(e => e.Source).IsRequired().HasMaxLength(50);
        builder.HasOne(e => e.Song).WithMany().HasForeignKey(e => e.SongId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(e => e.DanceStyle).WithMany().HasForeignKey(e => e.DanceStyleId).OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(e => new { e.SongId, e.DanceStyleId }).IsUnique();
    }
}
