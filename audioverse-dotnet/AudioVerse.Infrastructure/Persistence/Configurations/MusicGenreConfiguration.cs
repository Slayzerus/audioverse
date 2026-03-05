using AudioVerse.Domain.Entities.Audio;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations
{
    public class MusicGenreConfiguration : IEntityTypeConfiguration<MusicGenre>
    {
        public void Configure(EntityTypeBuilder<MusicGenre> builder)
        {
            builder.ToTable("MusicGenres");
            builder.HasKey(g => g.Id);
            builder.Property(g => g.Name).IsRequired().HasMaxLength(200);
            builder.HasIndex(g => g.Name).IsUnique();

            builder.HasMany(g => g.SubGenres).WithOne(g => g.ParentGenre).HasForeignKey(g => g.ParentGenreId).OnDelete(DeleteBehavior.Restrict);
        }
    }
}
