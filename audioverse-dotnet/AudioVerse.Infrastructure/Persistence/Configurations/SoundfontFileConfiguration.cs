using AudioVerse.Domain.Entities.Audio;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations;

/// <summary>EF configuration for SoundfontFile.</summary>
public class SoundfontFileConfiguration : IEntityTypeConfiguration<SoundfontFile>
{
    public void Configure(EntityTypeBuilder<SoundfontFile> b)
    {
        b.HasKey(e => e.Id);
        b.Property(e => e.FileName).HasMaxLength(500).IsRequired();
        b.Property(e => e.StorageKey).HasMaxLength(1000).IsRequired();
        b.Property(e => e.ContentType).HasMaxLength(100);
        b.Property(e => e.Sha256).HasMaxLength(64);
        b.HasIndex(e => e.SoundfontId).HasDatabaseName("IDX_SoundfontFile_SoundfontId");
    }
}
