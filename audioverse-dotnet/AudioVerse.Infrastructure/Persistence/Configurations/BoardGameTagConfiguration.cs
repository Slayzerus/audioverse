using AudioVerse.Domain.Entities.Games;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations;

public class BoardGameTagConfiguration : IEntityTypeConfiguration<BoardGameTag>
{
    public void Configure(EntityTypeBuilder<BoardGameTag> builder)
    {
        builder.ToTable("BoardGameTags");
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Name).IsRequired().HasMaxLength(100);
        builder.HasOne(e => e.BoardGame).WithMany(g => g.Tags).HasForeignKey(e => e.BoardGameId).OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(e => new { e.BoardGameId, e.Name }).IsUnique();
    }
}
