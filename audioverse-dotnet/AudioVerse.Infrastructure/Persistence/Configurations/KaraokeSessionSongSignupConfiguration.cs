using AudioVerse.Domain.Entities.Karaoke.KaraokeSessions;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations;

public class KaraokeSessionSongSignupConfiguration : IEntityTypeConfiguration<KaraokeSessionSongSignup>
{
    public void Configure(EntityTypeBuilder<KaraokeSessionSongSignup> builder)
    {
        builder.ToTable("KaraokeSessionSongSignups");
        builder.HasKey(e => e.Id);
        builder.HasIndex(e => new { e.PickId, e.PlayerId }).IsUnique();
    }
}
