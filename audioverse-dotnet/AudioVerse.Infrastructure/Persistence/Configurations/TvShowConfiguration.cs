using AudioVerse.Domain.Entities.Media;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations;

/// <summary>EF configuration for TvShow.</summary>
public class TvShowConfiguration : IEntityTypeConfiguration<TvShow>
{
    public void Configure(EntityTypeBuilder<TvShow> b)
    {
        b.HasKey(e => e.Id);
        b.Property(e => e.Title).HasMaxLength(500);
        b.HasOne(e => e.TvShowGenre).WithMany().HasForeignKey(e => e.TvShowGenreId).OnDelete(DeleteBehavior.SetNull);
        b.HasMany(e => e.Tags).WithOne(t => t.TvShow).HasForeignKey(t => t.TvShowId).OnDelete(DeleteBehavior.Cascade);
    }
}
