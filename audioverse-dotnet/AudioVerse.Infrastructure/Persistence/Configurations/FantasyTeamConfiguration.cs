using AudioVerse.Domain.Entities.Events;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations;

/// <summary>EF configuration for FantasyTeam.</summary>
public class FantasyTeamConfiguration : IEntityTypeConfiguration<FantasyTeam>
{
    public void Configure(EntityTypeBuilder<FantasyTeam> b)
    {
        b.HasKey(e => e.Id);
        b.Property(e => e.Name).HasMaxLength(200);
        b.HasMany(e => e.Players).WithOne(p => p.FantasyTeam).HasForeignKey(p => p.FantasyTeamId).OnDelete(DeleteBehavior.Cascade);
    }
}
