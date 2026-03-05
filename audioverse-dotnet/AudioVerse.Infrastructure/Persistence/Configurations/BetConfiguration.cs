using AudioVerse.Domain.Entities.Events;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations;

/// <summary>EF configuration for Bet.</summary>
public class BetConfiguration : IEntityTypeConfiguration<Bet>
{
    public void Configure(EntityTypeBuilder<Bet> b)
    {
        b.HasKey(e => e.Id);
        b.Property(e => e.Amount).HasPrecision(18, 2);
        b.Property(e => e.PotentialPayout).HasPrecision(18, 2);
        b.Property(e => e.ActualPayout).HasPrecision(18, 2);
        b.HasOne(e => e.Option).WithMany().HasForeignKey(e => e.OptionId).OnDelete(DeleteBehavior.NoAction);
    }
}
