using AudioVerse.Domain.Entities.Karaoke.KaraokeSessions;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations
{
    public class KaraokeSessionConfiguration : IEntityTypeConfiguration<KaraokeSession>
    {
        public void Configure(EntityTypeBuilder<KaraokeSession> builder)
        {
            builder.HasMany(s => s.Rounds)
                .WithOne(r => r.Session)
                .HasForeignKey(r => r.SessionId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasIndex(s => new { s.EventId })
                .HasDatabaseName("IDX_Session_Event");
        }
    }
}
