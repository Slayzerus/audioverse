using AudioVerse.Domain.Entities.Dmx;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations;

public class DmxSceneSequenceConfiguration : IEntityTypeConfiguration<DmxSceneSequence>
{
    public void Configure(EntityTypeBuilder<DmxSceneSequence> builder)
    {
        builder.HasKey(e => e.Id);
        builder.HasMany(e => e.Steps).WithOne().HasForeignKey(s => s.SequenceId).OnDelete(DeleteBehavior.Cascade);
    }
}
