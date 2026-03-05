using AudioVerse.Domain.Entities.Events;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations;

/// <summary>EF configuration for FantasyTeamPlayer.</summary>
public class FantasyTeamPlayerConfiguration : IEntityTypeConfiguration<FantasyTeamPlayer>
{
    public void Configure(EntityTypeBuilder<FantasyTeamPlayer> b)
    {
        b.HasKey(e => e.Id);
        b.Property(e => e.Name).HasMaxLength(200);
    }
}
