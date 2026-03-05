using AudioVerse.Domain.Entities.Events;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations;

public class EventExpenseShareConfiguration : IEntityTypeConfiguration<EventExpenseShare>
{
    public void Configure(EntityTypeBuilder<EventExpenseShare> builder)
    {
        builder.HasKey(e => e.Id);
        builder.Property(e => e.ShareAmount).HasPrecision(18, 2);
    }
}
