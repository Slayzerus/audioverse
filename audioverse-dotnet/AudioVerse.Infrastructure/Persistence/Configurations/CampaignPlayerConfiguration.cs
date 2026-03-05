using AudioVerse.Domain.Entities.Karaoke.Campaigns;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations;

public class CampaignPlayerConfiguration : IEntityTypeConfiguration<CampaignPlayer>
{
    public void Configure(EntityTypeBuilder<CampaignPlayer> builder)
    {
        builder.HasIndex(cp => new { cp.CampaignId, cp.PlayerId }).IsUnique();
    }
}
