using AudioVerse.Domain.Entities.Audio;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations;

/// <summary>EF configuration for Song.</summary>
public class SongConfiguration : IEntityTypeConfiguration<Song>
{
    public void Configure(EntityTypeBuilder<Song> builder)
    {
        builder.ToTable("LibrarySongs");
        builder.HasKey(e => e.Id);
        builder.HasOne(e => e.Album).WithMany(a => a.Songs).HasForeignKey(e => e.AlbumId).OnDelete(DeleteBehavior.SetNull);
        builder.HasOne(e => e.PrimaryArtist).WithMany().HasForeignKey(e => e.PrimaryArtistId).OnDelete(DeleteBehavior.SetNull);
        builder.HasMany(e => e.Details).WithOne(d => d.Song).HasForeignKey(d => d.SongId).IsRequired(false).OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(e => e.Title).HasDatabaseName("IDX_Song_Title");
    }
}
