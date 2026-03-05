using AudioVerse.Domain.Entities.Events;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations;

/// <summary>EF configuration for BettingOption.</summary>
public class BettingOptionConfiguration : IEntityTypeConfiguration<BettingOption>
{
    public void Configure(EntityTypeBuilder<BettingOption> b)
    {
        b.HasKey(e => e.Id);
        b.Property(e => e.Label).HasMaxLength(200);
        b.Property(e => e.Odds).HasPrecision(10, 4);
    }
}
