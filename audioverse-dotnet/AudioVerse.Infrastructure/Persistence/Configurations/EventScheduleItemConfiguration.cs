using AudioVerse.Domain.Entities.Events;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations;

public class EventScheduleItemConfiguration : IEntityTypeConfiguration<EventScheduleItem>
{
    public void Configure(EntityTypeBuilder<EventScheduleItem> builder)
    {
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Category).HasConversion<int>();
        builder.HasIndex(e => e.EventId).HasDatabaseName("IDX_Schedule_Event");
    }
}
