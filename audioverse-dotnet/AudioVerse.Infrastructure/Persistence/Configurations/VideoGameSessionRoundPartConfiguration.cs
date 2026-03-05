using AudioVerse.Domain.Entities.Games;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations;

public class VideoGameSessionRoundPartConfiguration : IEntityTypeConfiguration<VideoGameSessionRoundPart>
{
    public void Configure(EntityTypeBuilder<VideoGameSessionRoundPart> builder)
    {
        builder.HasKey(e => e.Id);
        builder.HasOne(e => e.Round).WithMany(r => r.Parts).HasForeignKey(e => e.RoundId).OnDelete(DeleteBehavior.Cascade);
    }
}
