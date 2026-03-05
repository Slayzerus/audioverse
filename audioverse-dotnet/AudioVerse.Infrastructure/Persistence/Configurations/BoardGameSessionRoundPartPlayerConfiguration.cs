using AudioVerse.Domain.Entities.Games;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations;

public class BoardGameSessionRoundPartPlayerConfiguration : IEntityTypeConfiguration<BoardGameSessionRoundPartPlayer>
{
    public void Configure(EntityTypeBuilder<BoardGameSessionRoundPartPlayer> builder)
    {
        builder.HasKey(e => e.Id);
        builder.HasOne(e => e.Part).WithMany(p => p.Players).HasForeignKey(e => e.PartId).OnDelete(DeleteBehavior.Cascade);
    }
}
