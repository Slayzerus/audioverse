using AudioVerse.Domain.Entities.Media;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations;

/// <summary>EF configuration for TvShowCollection.</summary>
public class TvShowCollectionConfiguration : IEntityTypeConfiguration<TvShowCollection>
{
    public void Configure(EntityTypeBuilder<TvShowCollection> b)
    {
        b.HasKey(e => e.Id);
        b.HasOne(e => e.Parent).WithMany(e => e.Children).HasForeignKey(e => e.ParentId).OnDelete(DeleteBehavior.Restrict);
    }
}
