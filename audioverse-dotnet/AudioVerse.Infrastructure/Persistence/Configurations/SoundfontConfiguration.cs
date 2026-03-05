using AudioVerse.Domain.Entities.Audio;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations;

/// <summary>EF configuration for Soundfont.</summary>
public class SoundfontConfiguration : IEntityTypeConfiguration<Soundfont>
{
    public void Configure(EntityTypeBuilder<Soundfont> b)
    {
        b.HasKey(e => e.Id);
        b.Property(e => e.Name).HasMaxLength(300).IsRequired();
        b.Property(e => e.Author).HasMaxLength(200);
        b.Property(e => e.Version).HasMaxLength(50);
        b.Property(e => e.License).HasMaxLength(100);
        b.Property(e => e.Tags).HasMaxLength(500);
        b.HasMany(e => e.Files).WithOne(f => f.Soundfont).HasForeignKey(f => f.SoundfontId).OnDelete(DeleteBehavior.Cascade);
        b.HasIndex(e => e.Name).HasDatabaseName("IDX_Soundfont_Name");
    }
}
