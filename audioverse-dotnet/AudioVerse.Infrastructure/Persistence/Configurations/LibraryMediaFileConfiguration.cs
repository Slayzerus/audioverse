using AudioVerse.Domain.Entities.Audio;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations;

/// <summary>EF configuration for MediaFile.</summary>
public class LibraryMediaFileConfiguration : IEntityTypeConfiguration<MediaFile>
{
    public void Configure(EntityTypeBuilder<MediaFile> builder)
    {
        builder.ToTable("LibraryMediaFiles");
        builder.HasKey(e => e.Id);
        builder.HasOne(e => e.Song).WithMany().HasForeignKey(e => e.SongId).OnDelete(DeleteBehavior.SetNull);
        builder.HasOne(e => e.Album).WithMany().HasForeignKey(e => e.AlbumId).OnDelete(DeleteBehavior.SetNull);
    }
}
