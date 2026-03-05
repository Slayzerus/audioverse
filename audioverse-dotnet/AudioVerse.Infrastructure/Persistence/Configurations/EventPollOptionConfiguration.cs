using AudioVerse.Domain.Entities.Events;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations;

public class EventPollOptionConfiguration : IEntityTypeConfiguration<EventPollOption>
{
    public void Configure(EntityTypeBuilder<EventPollOption> builder)
    {
        builder.HasKey(e => e.Id);
        builder.Property(e => e.SourceEntityType).HasConversion<int?>();
    }
}
