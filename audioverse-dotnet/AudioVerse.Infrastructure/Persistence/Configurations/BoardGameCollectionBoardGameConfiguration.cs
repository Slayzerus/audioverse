using AudioVerse.Domain.Entities.Games;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations;

public class BoardGameCollectionBoardGameConfiguration : IEntityTypeConfiguration<BoardGameCollectionBoardGame>
{
    public void Configure(EntityTypeBuilder<BoardGameCollectionBoardGame> builder)
    {
        builder.HasKey(e => e.Id);
        builder.HasOne(e => e.Collection).WithMany(c => c.Items).HasForeignKey(e => e.CollectionId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(e => e.BoardGame).WithMany().HasForeignKey(e => e.BoardGameId).OnDelete(DeleteBehavior.Cascade);
    }
}
