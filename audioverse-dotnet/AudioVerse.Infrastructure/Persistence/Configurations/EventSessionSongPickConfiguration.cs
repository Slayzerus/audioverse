using AudioVerse.Domain.Entities.Events;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations;

public class EventSessionSongPickConfiguration : IEntityTypeConfiguration<EventSessionSongPick>
{
    public void Configure(EntityTypeBuilder<EventSessionSongPick> builder)
    {
        builder.ToTable("EventSessionSongPicks");
        builder.HasKey(e => e.Id);
        builder.Property(e => e.SongTitle).HasMaxLength(500);
        builder.HasOne(e => e.Event).WithMany().HasForeignKey(e => e.EventId).IsRequired(false).OnDelete(DeleteBehavior.Cascade);
        builder.HasMany(e => e.Signups).WithOne(s => s.Pick).HasForeignKey(s => s.PickId).OnDelete(DeleteBehavior.Cascade);
    }
}
