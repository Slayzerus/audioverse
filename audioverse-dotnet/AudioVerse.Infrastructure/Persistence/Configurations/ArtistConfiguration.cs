using AudioVerse.Domain.Entities.Audio;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations;

/// <summary>EF configuration for Artist.</summary>
public class ArtistConfiguration : IEntityTypeConfiguration<Artist>
{
    public void Configure(EntityTypeBuilder<Artist> builder)
    {
        builder.ToTable("LibraryArtists");
        builder.HasKey(e => e.Id);
        builder.HasOne(e => e.Detail).WithOne(d => d!.Artist!).HasForeignKey<ArtistDetail>(d => d.ArtistId).OnDelete(DeleteBehavior.Cascade);
        builder.HasMany(e => e.Facts).WithOne(f => f.Artist!).HasForeignKey(f => f.ArtistId).OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(e => e.NormalizedName).HasDatabaseName("IDX_Artist_NormalizedName");
    }
}
