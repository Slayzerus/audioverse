using AudioVerse.Domain.Entities.Dmx;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations;

public class DmxSceneStepConfiguration : IEntityTypeConfiguration<DmxSceneStep>
{
    public void Configure(EntityTypeBuilder<DmxSceneStep> builder)
    {
        builder.HasKey(e => e.Id);
        builder.HasOne(e => e.Scene).WithMany().HasForeignKey(e => e.SceneId).OnDelete(DeleteBehavior.Cascade);
    }
}
