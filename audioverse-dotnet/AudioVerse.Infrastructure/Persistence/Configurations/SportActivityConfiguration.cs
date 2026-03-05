using AudioVerse.Domain.Entities.Media;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations;

/// <summary>EF configuration for SportActivity.</summary>
public class SportActivityConfiguration : IEntityTypeConfiguration<SportActivity>
{
    public void Configure(EntityTypeBuilder<SportActivity> b)
    {
        b.HasKey(e => e.Id);
        b.Property(e => e.Name).HasMaxLength(200);
        b.HasOne(e => e.SportGenre).WithMany().HasForeignKey(e => e.SportGenreId).OnDelete(DeleteBehavior.SetNull);
        b.HasMany(e => e.Tags).WithOne(t => t.SportActivity).HasForeignKey(t => t.SportActivityId).OnDelete(DeleteBehavior.Cascade);
    }
}
