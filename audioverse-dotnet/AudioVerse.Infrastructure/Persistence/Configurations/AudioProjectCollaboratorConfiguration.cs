using AudioVerse.Domain.Entities.Editor;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations;

/// <summary>EF configuration for AudioProjectCollaborator.</summary>
public class AudioProjectCollaboratorConfiguration : IEntityTypeConfiguration<AudioProjectCollaborator>
{
    public void Configure(EntityTypeBuilder<AudioProjectCollaborator> builder)
    {
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Permission).HasConversion<int>();
        builder.HasOne(e => e.Project).WithMany().HasForeignKey(e => e.ProjectId).OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(e => new { e.ProjectId, e.UserId }).IsUnique().HasDatabaseName("UQ_ProjCollab_Project_User");
    }
}
