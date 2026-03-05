using AudioVerse.Domain.Entities.Audio;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations;

/// <summary>EF configuration for AlbumArtist.</summary>
public class AlbumArtistConfiguration : IEntityTypeConfiguration<AlbumArtist>
{
    public void Configure(EntityTypeBuilder<AlbumArtist> builder)
    {
        builder.ToTable("LibraryAlbumArtists");
        builder.HasKey(e => new { e.AlbumId, e.ArtistId });
        builder.HasOne(e => e.Album).WithMany(a => a.AlbumArtists).HasForeignKey(e => e.AlbumId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(e => e.Artist).WithMany().HasForeignKey(e => e.ArtistId).OnDelete(DeleteBehavior.Cascade);
        builder.Property(e => e.Role).HasConversion<int>();
    }
}
