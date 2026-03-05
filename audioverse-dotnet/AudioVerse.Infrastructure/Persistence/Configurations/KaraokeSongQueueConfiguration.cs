using AudioVerse.Domain.Entities.Karaoke.KaraokeSongFiles;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations;

public class KaraokeSongQueueItemConfiguration : IEntityTypeConfiguration<KaraokeSongFileQueueItem>
{
    public void Configure(EntityTypeBuilder<KaraokeSongFileQueueItem> builder)
    {
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Status).HasConversion<int>();
        builder.HasOne(e => e.Song).WithMany().HasForeignKey(e => e.SongId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(e => e.RequestedByPlayer).WithMany().HasForeignKey(e => e.RequestedByPlayerId).OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(e => e.EventId).HasDatabaseName("IDX_SongQueue_Event");
    }
}
