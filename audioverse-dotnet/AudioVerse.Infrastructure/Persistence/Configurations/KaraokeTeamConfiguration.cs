using AudioVerse.Domain.Entities.Karaoke.KaraokeTeams;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations;

public class KaraokeTeamConfiguration : IEntityTypeConfiguration<KaraokeTeam>
{
    public void Configure(EntityTypeBuilder<KaraokeTeam> builder)
    {
        builder.HasKey(t => t.Id);
        builder.HasOne(t => t.CreatedByPlayer)
            .WithMany()
            .HasForeignKey(t => t.CreatedByPlayerId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasMany(t => t.Players)
            .WithOne(tp => tp.Team)
            .HasForeignKey(tp => tp.TeamId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
