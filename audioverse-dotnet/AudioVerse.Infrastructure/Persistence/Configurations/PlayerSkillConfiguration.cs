using AudioVerse.Domain.Entities.Karaoke.Campaigns;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations;

public class PlayerSkillConfiguration : IEntityTypeConfiguration<PlayerSkill>
{
    public void Configure(EntityTypeBuilder<PlayerSkill> builder)
    {
        builder.HasIndex(ps => new { ps.PlayerId, ps.SkillDefinitionId }).IsUnique();
    }
}
