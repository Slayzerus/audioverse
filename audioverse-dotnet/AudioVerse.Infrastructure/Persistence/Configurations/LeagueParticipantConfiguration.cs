using AudioVerse.Domain.Entities.Events;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations;

/// <summary>EF configuration for LeagueParticipant.</summary>
public class LeagueParticipantConfiguration : IEntityTypeConfiguration<LeagueParticipant>
{
    public void Configure(EntityTypeBuilder<LeagueParticipant> b)
    {
        b.HasKey(e => e.Id);
        b.Property(e => e.Name).HasMaxLength(200);
    }
}
