using AudioVerse.Domain.Entities.Games;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations;

public class VideoGameGenreConfiguration : IEntityTypeConfiguration<VideoGameGenre>
{
    public void Configure(EntityTypeBuilder<VideoGameGenre> builder)
    {
        builder.ToTable("VideoGameGenres");
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Name).IsRequired().HasMaxLength(200);
        builder.HasIndex(e => e.Name).IsUnique();
        builder.HasMany(e => e.SubGenres).WithOne(e => e.ParentGenre).HasForeignKey(e => e.ParentGenreId).OnDelete(DeleteBehavior.Restrict);
    }
}
