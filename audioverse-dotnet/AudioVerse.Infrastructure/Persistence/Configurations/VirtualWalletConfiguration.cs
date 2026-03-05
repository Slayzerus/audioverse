using AudioVerse.Domain.Entities.Events;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations;

/// <summary>EF configuration for VirtualWallet.</summary>
public class VirtualWalletConfiguration : IEntityTypeConfiguration<VirtualWallet>
{
    public void Configure(EntityTypeBuilder<VirtualWallet> b)
    {
        b.HasKey(e => e.Id);
        b.Property(e => e.Balance).HasPrecision(18, 2);
        b.Property(e => e.TotalWagered).HasPrecision(18, 2);
        b.Property(e => e.TotalWon).HasPrecision(18, 2);
        b.HasIndex(e => new { e.UserId, e.LeagueId }).IsUnique();
    }
}
