using AudioVerse.Domain.Entities.Games;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations;

public class VideoGameConfiguration : IEntityTypeConfiguration<VideoGame>
{
    public void Configure(EntityTypeBuilder<VideoGame> builder)
    {
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Platform).HasConversion<int>();
        builder.HasOne(e => e.VideoGameGenre).WithMany().HasForeignKey(e => e.VideoGameGenreId).OnDelete(DeleteBehavior.SetNull);
    }
}
