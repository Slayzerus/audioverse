using AudioVerse.Domain.Entities.Karaoke.Campaigns;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations;

public class CampaignRoundProgressConfiguration : IEntityTypeConfiguration<CampaignRoundProgress>
{
    public void Configure(EntityTypeBuilder<CampaignRoundProgress> builder)
    {
        builder.HasIndex(r => new { r.CampaignId, r.RoundNumber }).IsUnique();
    }
}
