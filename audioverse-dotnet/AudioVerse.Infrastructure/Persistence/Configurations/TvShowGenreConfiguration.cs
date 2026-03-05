using AudioVerse.Domain.Entities.Media;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations;

/// <summary>EF configuration for TvShowGenre.</summary>
public class TvShowGenreConfiguration : IEntityTypeConfiguration<TvShowGenre>
{
    public void Configure(EntityTypeBuilder<TvShowGenre> b)
    {
        b.HasKey(e => e.Id);
        b.Property(e => e.Name).HasMaxLength(100);
    }
}
