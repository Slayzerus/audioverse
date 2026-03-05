using AudioVerse.Domain.Entities.Events;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations;

public class EventMenuItemConfiguration : IEntityTypeConfiguration<EventMenuItem>
{
    public void Configure(EntityTypeBuilder<EventMenuItem> builder)
    {
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Category).HasConversion<int>();
        builder.HasIndex(e => e.EventId).HasDatabaseName("IDX_Menu_Event");
    }
}
