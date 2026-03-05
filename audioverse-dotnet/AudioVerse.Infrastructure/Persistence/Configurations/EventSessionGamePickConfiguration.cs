using AudioVerse.Domain.Entities.Events;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations;

public class EventSessionGamePickConfiguration : IEntityTypeConfiguration<EventSessionGamePick>
{
    public void Configure(EntityTypeBuilder<EventSessionGamePick> builder)
    {
        builder.ToTable("EventSessionGamePicks");
        builder.HasKey(e => e.Id);
        builder.Property(e => e.GameName).HasMaxLength(300);
        builder.HasOne(e => e.Event).WithMany().HasForeignKey(e => e.EventId).IsRequired(false).OnDelete(DeleteBehavior.Cascade);
        builder.HasMany(e => e.Votes).WithOne(v => v.Pick).HasForeignKey(v => v.PickId).OnDelete(DeleteBehavior.Cascade);
    }
}
