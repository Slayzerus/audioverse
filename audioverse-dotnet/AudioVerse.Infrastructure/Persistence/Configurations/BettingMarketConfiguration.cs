using AudioVerse.Domain.Entities.Events;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations;

/// <summary>EF configuration for BettingMarket.</summary>
public class BettingMarketConfiguration : IEntityTypeConfiguration<BettingMarket>
{
    public void Configure(EntityTypeBuilder<BettingMarket> b)
    {
        b.HasKey(e => e.Id);
        b.Property(e => e.Title).HasMaxLength(300);
        b.HasOne(e => e.Event).WithMany().HasForeignKey(e => e.EventId).IsRequired(false).OnDelete(DeleteBehavior.Cascade);
        b.HasMany(e => e.Options).WithOne(o => o.Market).HasForeignKey(o => o.MarketId).OnDelete(DeleteBehavior.Cascade);
        b.HasMany(e => e.Bets).WithOne(bet => bet.Market).HasForeignKey(bet => bet.MarketId).OnDelete(DeleteBehavior.Cascade);
    }
}
