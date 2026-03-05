using AudioVerse.Domain.Entities.Events;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations;

/// <summary>EF configuration for League.</summary>
public class LeagueConfiguration : IEntityTypeConfiguration<League>
{
    public void Configure(EntityTypeBuilder<League> b)
    {
        b.HasKey(e => e.Id);
        b.Property(e => e.Name).HasMaxLength(300);
        b.HasMany(e => e.Events).WithOne(le => le.League).HasForeignKey(le => le.LeagueId).OnDelete(DeleteBehavior.Cascade);
        b.HasMany(e => e.Participants).WithOne(p => p.League).HasForeignKey(p => p.LeagueId).OnDelete(DeleteBehavior.Cascade);
    }
}
