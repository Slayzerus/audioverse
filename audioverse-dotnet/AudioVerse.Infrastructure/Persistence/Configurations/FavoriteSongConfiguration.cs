using AudioVerse.Domain.Entities.Karaoke;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations;

public class FavoriteSongConfiguration : IEntityTypeConfiguration<KaraokeFavoriteSong>
{
    public void Configure(EntityTypeBuilder<KaraokeFavoriteSong> builder)
    {
        builder.HasKey(e => e.Id);
        builder.HasOne(e => e.Player).WithMany().HasForeignKey(e => e.PlayerId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(e => e.Song).WithMany().HasForeignKey(e => e.SongId).OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(e => new { e.PlayerId, e.SongId }).IsUnique().HasDatabaseName("UQ_FavSong_Player_Song");
    }
}
