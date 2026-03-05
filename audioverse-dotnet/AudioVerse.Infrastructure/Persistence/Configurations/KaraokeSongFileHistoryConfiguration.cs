using AudioVerse.Domain.Entities.Karaoke.KaraokeSongFiles;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations;

public class KaraokeSongFileHistoryConfiguration : IEntityTypeConfiguration<KaraokeSongFileHistory>
{
    public void Configure(EntityTypeBuilder<KaraokeSongFileHistory> builder)
    {
        builder.HasKey(h => h.Id);
    }
}
