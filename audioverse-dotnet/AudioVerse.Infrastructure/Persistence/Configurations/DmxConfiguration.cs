using AudioVerse.Domain.Entities.Dmx;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations;

public class DmxSceneConfiguration : IEntityTypeConfiguration<DmxScene>
{
    public void Configure(EntityTypeBuilder<DmxScene> builder)
    {
        builder.HasKey(e => e.Id);
    }
}
