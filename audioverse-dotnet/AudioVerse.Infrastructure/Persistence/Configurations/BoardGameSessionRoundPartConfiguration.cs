using AudioVerse.Domain.Entities.Games;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations;

public class BoardGameSessionRoundPartConfiguration : IEntityTypeConfiguration<BoardGameSessionRoundPart>
{
    public void Configure(EntityTypeBuilder<BoardGameSessionRoundPart> builder)
    {
        builder.HasKey(e => e.Id);
        builder.HasOne(e => e.Round).WithMany(r => r.Parts).HasForeignKey(e => e.RoundId).OnDelete(DeleteBehavior.Cascade);
    }
}
