using AudioVerse.Domain.Entities.Games;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations;

public class VideoGameSessionRoundConfiguration : IEntityTypeConfiguration<VideoGameSessionRound>
{
    public void Configure(EntityTypeBuilder<VideoGameSessionRound> builder)
    {
        builder.HasKey(e => e.Id);
        builder.HasOne(e => e.Session).WithMany(s => s.Rounds).HasForeignKey(e => e.SessionId).OnDelete(DeleteBehavior.Cascade);
    }
}
