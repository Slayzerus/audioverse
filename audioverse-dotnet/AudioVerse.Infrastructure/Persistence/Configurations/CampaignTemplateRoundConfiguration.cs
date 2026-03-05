using AudioVerse.Domain.Entities.Karaoke.Campaigns;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations;

public class CampaignTemplateRoundConfiguration : IEntityTypeConfiguration<CampaignTemplateRound>
{
    public void Configure(EntityTypeBuilder<CampaignTemplateRound> builder)
    {
        builder.HasMany(r => r.SongPool)
            .WithOne(s => s.TemplateRound)
            .HasForeignKey(s => s.TemplateRoundId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(r => r.RewardSkillDefinition)
            .WithMany()
            .HasForeignKey(r => r.RewardSkillDefinitionId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
