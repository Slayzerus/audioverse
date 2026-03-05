using AudioVerse.Domain.Entities.Events;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations;

/// <summary>EF configuration for LeagueEvent.</summary>
public class LeagueEventConfiguration : IEntityTypeConfiguration<LeagueEvent>
{
    public void Configure(EntityTypeBuilder<LeagueEvent> b)
    {
        b.HasKey(e => e.Id);
        b.HasOne(e => e.Event).WithMany().HasForeignKey(e => e.EventId).IsRequired(false).OnDelete(DeleteBehavior.Cascade);
    }
}
