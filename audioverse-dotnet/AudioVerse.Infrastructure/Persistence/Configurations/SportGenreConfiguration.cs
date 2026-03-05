using AudioVerse.Domain.Entities.Media;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations;

/// <summary>EF configuration for SportGenre.</summary>
public class SportGenreConfiguration : IEntityTypeConfiguration<SportGenre>
{
    public void Configure(EntityTypeBuilder<SportGenre> b)
    {
        b.HasKey(e => e.Id);
        b.Property(e => e.Name).HasMaxLength(100);
    }
}
