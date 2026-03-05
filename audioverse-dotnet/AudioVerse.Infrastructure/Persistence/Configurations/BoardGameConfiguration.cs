using AudioVerse.Domain.Entities.Games;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations;

public class BoardGameConfiguration : IEntityTypeConfiguration<BoardGame>
{
    public void Configure(EntityTypeBuilder<BoardGame> builder)
    {
        builder.HasKey(e => e.Id);
        builder.HasOne(e => e.BoardGameGenre).WithMany().HasForeignKey(e => e.BoardGameGenreId).OnDelete(DeleteBehavior.SetNull);
    }
}
