using AudioVerse.Domain.Entities.Audio;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations;

/// <summary>EF configuration for ArtistDetail.</summary>
public class ArtistDetailConfiguration : IEntityTypeConfiguration<ArtistDetail>
{
    public void Configure(EntityTypeBuilder<ArtistDetail> builder)
    {
        builder.ToTable("LibraryArtistDetails");
        builder.HasKey(e => e.Id);
    }
}
