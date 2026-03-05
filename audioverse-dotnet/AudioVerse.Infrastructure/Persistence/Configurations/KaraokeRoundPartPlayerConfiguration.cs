using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using AudioVerse.Domain.Entities.Karaoke.KaraokeSessions;

namespace AudioVerse.Infrastructure.Persistence.Configurations
{
    public class KaraokeRoundPartPlayerConfiguration : IEntityTypeConfiguration<KaraokeSessionRoundPartPlayer>
    {
        public void Configure(EntityTypeBuilder<KaraokeSessionRoundPartPlayer> builder)
        {
            builder.HasOne(p => p.RoundPart)
                .WithMany(rp => rp.Players)
                .HasForeignKey(p => p.RoundPartId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(p => p.Player)
                .WithMany()
                .HasForeignKey(p => p.PlayerId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
