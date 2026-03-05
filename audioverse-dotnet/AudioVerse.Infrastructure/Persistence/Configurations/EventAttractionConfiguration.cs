using AudioVerse.Domain.Entities.Events;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations;

public class EventAttractionConfiguration : IEntityTypeConfiguration<EventAttraction>
{
    public void Configure(EntityTypeBuilder<EventAttraction> builder)
    {
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Type).HasConversion<int>();
        builder.HasIndex(e => e.EventId).HasDatabaseName("IDX_Attraction_Event");
    }
}
