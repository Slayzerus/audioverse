using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using AudioVerse.Domain.Entities.Karaoke.KaraokeSessions;

namespace AudioVerse.Infrastructure.Persistence.Configurations
{
    public class KaraokeRoundPlayerConfiguration : IEntityTypeConfiguration<KaraokeSessionRoundPlayer>
    {
        public void Configure(EntityTypeBuilder<KaraokeSessionRoundPlayer> builder)
        {
            builder.HasKey(rp => rp.Id);

            builder.HasOne(p => p.Round)
                .WithMany(r => r.Players)
                .HasForeignKey(p => p.RoundId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasIndex(rp => rp.RoundId)
                .HasDatabaseName("IDX_KRP_Round");

            builder.HasIndex(rp => new { rp.RoundId, rp.PlayerId })
                .HasDatabaseName("IDX_KRP_RoundPlayer");

            builder.HasIndex(rp => new { rp.RoundId, rp.PlayerId, rp.Slot })
                .IsUnique()
                .HasDatabaseName("UQ_KRP_Round_Player_Slot");
        }
    }
}
