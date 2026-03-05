using AudioVerse.Domain.Entities.Events;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations;

public class EventPaymentConfiguration : IEntityTypeConfiguration<EventPayment>
{
    public void Configure(EntityTypeBuilder<EventPayment> builder)
    {
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Amount).HasPrecision(18, 2);
        builder.Property(e => e.Method).HasConversion<int>();
        builder.Property(e => e.Status).HasConversion<int>();
        builder.HasIndex(e => e.EventId).HasDatabaseName("IDX_Payment_Event");
        builder.HasIndex(e => new { e.EventId, e.UserId }).HasDatabaseName("IDX_Payment_EventUser");
    }
}
