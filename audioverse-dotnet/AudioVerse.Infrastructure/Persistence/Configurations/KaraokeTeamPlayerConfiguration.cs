using AudioVerse.Domain.Entities.Karaoke.KaraokeTeams;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations;

public class KaraokeTeamPlayerConfiguration : IEntityTypeConfiguration<KaraokeTeamPlayer>
{
    public void Configure(EntityTypeBuilder<KaraokeTeamPlayer> builder)
    {
        builder.HasKey(tp => tp.Id);
        builder.HasOne(tp => tp.Player)
            .WithMany()
            .HasForeignKey(tp => tp.PlayerId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(tp => new { tp.TeamId, tp.PlayerId })
            .IsUnique()
            .HasDatabaseName("UQ_KTP_Team_Player");
    }
}
