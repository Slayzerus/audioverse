using AudioVerse.Domain.Entities.Karaoke.Campaigns;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations;

public class CampaignTemplateConfiguration : IEntityTypeConfiguration<CampaignTemplate>
{
    public void Configure(EntityTypeBuilder<CampaignTemplate> builder)
    {
        builder.HasMany(t => t.Rounds)
            .WithOne(r => r.Template)
            .HasForeignKey(r => r.TemplateId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(t => t.CreatedByPlayerId);
    }
}
