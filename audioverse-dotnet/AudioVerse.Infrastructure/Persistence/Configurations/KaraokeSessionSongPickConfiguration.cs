using AudioVerse.Domain.Entities.Karaoke.KaraokeSessions;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations;

public class KaraokeSessionSongPickConfiguration : IEntityTypeConfiguration<KaraokeSessionSongPick>
{
    public void Configure(EntityTypeBuilder<KaraokeSessionSongPick> builder)
    {
        builder.ToTable("KaraokeSessionSongPicks");
        builder.HasKey(e => e.Id);
        builder.Property(e => e.SongTitle).HasMaxLength(500);
        builder.HasMany(e => e.Signups).WithOne(s => s.Pick).HasForeignKey(s => s.PickId).OnDelete(DeleteBehavior.Cascade);
    }
}
