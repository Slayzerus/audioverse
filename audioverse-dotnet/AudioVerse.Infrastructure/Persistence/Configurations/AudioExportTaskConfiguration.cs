using AudioVerse.Domain.Entities.Editor;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations;

/// <summary>EF configuration for AudioExportTask.</summary>
public class AudioExportTaskConfiguration : IEntityTypeConfiguration<AudioExportTask>
{
    public void Configure(EntityTypeBuilder<AudioExportTask> builder)
    {
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Status).HasConversion<int>();
        builder.HasIndex(e => e.ProjectId).HasDatabaseName("IDX_ExportTask_Project");
    }
}
