using AudioVerse.Domain.Entities.Audio;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations;

/// <summary>EF configuration for AudioFile.</summary>
public class LibraryAudioFileConfiguration : IEntityTypeConfiguration<AudioFile>
{
    public void Configure(EntityTypeBuilder<AudioFile> builder)
    {
        builder.ToTable("LibraryAudioFiles");
        builder.HasKey(e => e.Id);
        builder.HasOne(e => e.Song).WithMany().HasForeignKey(e => e.SongId).OnDelete(DeleteBehavior.SetNull);
        builder.HasOne(e => e.Album).WithMany().HasForeignKey(e => e.AlbumId).OnDelete(DeleteBehavior.SetNull);
        builder.Property(e => e.IsPrivate).HasDefaultValue(false);
        builder.HasIndex(e => new { e.OwnerId, e.IsPrivate });
    }
}
