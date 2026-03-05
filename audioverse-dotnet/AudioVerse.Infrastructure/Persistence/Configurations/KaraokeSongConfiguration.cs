using AudioVerse.Domain.Entities.Karaoke.KaraokeSongFiles;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations;

public class KaraokeSongFileConfiguration : IEntityTypeConfiguration<KaraokeSongFile>
{
    public void Configure(EntityTypeBuilder<KaraokeSongFile> builder)
    {
        builder.HasMany(s => s.Notes)
            .WithOne()
            .HasForeignKey(ps => ps.SongId);

        builder.HasOne(s => s.LinkedSong)
            .WithMany()
            .HasForeignKey(s => s.LinkedSongId)
            .OnDelete(DeleteBehavior.SetNull)
            .IsRequired(false);

        builder.HasIndex(s => s.LinkedSongId);
    }
}
