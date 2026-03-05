using AudioVerse.Domain.Entities.Karaoke.KaraokeSessions;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations;

public class KaraokeSessionPlaylistConfiguration : IEntityTypeConfiguration<KaraokeSessionPlaylist>
{
    public void Configure(EntityTypeBuilder<KaraokeSessionPlaylist> builder)
    {
        builder.HasKey(kpp => new { kpp.SessionId, kpp.PlaylistId });
    }
}
