using AudioVerse.Domain.Entities.Admin;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations;

public class AdminScoringPresetConfiguration : IEntityTypeConfiguration<ScoringPreset>
{
    public void Configure(EntityTypeBuilder<ScoringPreset> builder)
    {
        builder.ToTable("AdminScoringPresets");

        builder.HasData(new ScoringPreset
        {
            Id = 1,
            DataJson = "{\"easy\":{\"semitoneTolerance\":2,\"preWindow\":0.25,\"postExtra\":0.3,\"difficultyMult\":0.9},\"normal\":{\"semitoneTolerance\":1,\"preWindow\":0.15,\"postExtra\":0.2,\"difficultyMult\":1.0},\"hard\":{\"semitoneTolerance\":0,\"preWindow\":0.08,\"postExtra\":0.12,\"difficultyMult\":1.05}}",
            ModifiedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc),
            ModifiedByUserId = null,
            ModifiedByUsername = "system"
        });
    }
}
