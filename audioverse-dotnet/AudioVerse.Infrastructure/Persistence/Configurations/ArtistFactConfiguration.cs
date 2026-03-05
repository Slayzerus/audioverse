using AudioVerse.Domain.Entities.Audio;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations;

/// <summary>EF configuration for ArtistFact.</summary>
public class ArtistFactConfiguration : IEntityTypeConfiguration<ArtistFact>
{
    public void Configure(EntityTypeBuilder<ArtistFact> builder)
    {
        builder.ToTable("LibraryArtistFacts");
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Type).HasConversion<int>();
    }
}
