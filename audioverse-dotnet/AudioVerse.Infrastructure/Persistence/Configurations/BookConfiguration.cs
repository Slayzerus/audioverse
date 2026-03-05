using AudioVerse.Domain.Entities.Media;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations;

/// <summary>EF configuration for Book.</summary>
public class BookConfiguration : IEntityTypeConfiguration<Book>
{
    public void Configure(EntityTypeBuilder<Book> b)
    {
        b.HasKey(e => e.Id);
        b.Property(e => e.Title).HasMaxLength(500);
        b.Property(e => e.Isbn).HasMaxLength(20);
        b.HasOne(e => e.BookGenre).WithMany().HasForeignKey(e => e.BookGenreId).OnDelete(DeleteBehavior.SetNull);
        b.HasMany(e => e.Tags).WithOne(t => t.Book).HasForeignKey(t => t.BookId).OnDelete(DeleteBehavior.Cascade);
    }
}
