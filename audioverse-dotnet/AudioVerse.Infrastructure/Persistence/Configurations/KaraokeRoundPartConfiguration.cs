using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using AudioVerse.Domain.Entities.Karaoke.KaraokeSessions;

namespace AudioVerse.Infrastructure.Persistence.Configurations
{
    public class KaraokeRoundPartConfiguration : IEntityTypeConfiguration<KaraokeSessionRoundPart>
    {
        public void Configure(EntityTypeBuilder<KaraokeSessionRoundPart> builder)
        {
            builder.HasOne(p => p.Round)
                .WithMany(r => r.Parts)
                .HasForeignKey(p => p.RoundId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
