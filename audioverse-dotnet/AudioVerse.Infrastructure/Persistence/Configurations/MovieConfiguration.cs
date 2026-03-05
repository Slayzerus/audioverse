using AudioVerse.Domain.Entities.Media;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations;

/// <summary>EF configuration for Movie.</summary>
public class MovieConfiguration : IEntityTypeConfiguration<Movie>
{
    public void Configure(EntityTypeBuilder<Movie> b)
    {
        b.HasKey(e => e.Id);
        b.Property(e => e.Title).HasMaxLength(500);
        b.HasOne(e => e.MovieGenre).WithMany().HasForeignKey(e => e.MovieGenreId).OnDelete(DeleteBehavior.SetNull);
        b.HasMany(e => e.Tags).WithOne(t => t.Movie).HasForeignKey(t => t.MovieId).OnDelete(DeleteBehavior.Cascade);
    }
}
