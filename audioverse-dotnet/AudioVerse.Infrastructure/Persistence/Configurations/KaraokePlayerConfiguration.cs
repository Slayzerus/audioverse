using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using AudioVerse.Domain.Entities.Karaoke.KaraokeSessions;

namespace AudioVerse.Infrastructure.Persistence.Configurations
{
    public class KaraokePlayerConfiguration : IEntityTypeConfiguration<KaraokeSessionPlayer>
    {
        public void Configure(EntityTypeBuilder<KaraokeSessionPlayer> builder)
        {
            builder.HasKey(kpp => kpp.Id);

            builder.HasOne(p => p.Player)
                .WithMany(p => p.KaraokeSessionsLinks)
                .HasForeignKey(p => p.PlayerId);

            builder.HasIndex(kpp => new { kpp.EventId, kpp.PlayerId })
                .IsUnique()
                .HasDatabaseName("UQ_KPP_Event_Player");

            builder.Property(p => p.Status)
                .HasConversion<int>()
                .HasDefaultValue(KaraokePlayerStatus.None);

            builder.Property(p => p.Permissions)
                .HasConversion<int>()
                .HasDefaultValue(EventPermission.None);

            builder.HasIndex(pp => new { pp.EventId })
                .HasDatabaseName("IDX_KPP_Event");
        }
    }
}
