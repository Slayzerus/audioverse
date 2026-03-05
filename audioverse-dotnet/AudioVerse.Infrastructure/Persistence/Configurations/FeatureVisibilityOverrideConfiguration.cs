using AudioVerse.Domain.Entities.Admin;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations;

public class FeatureVisibilityOverrideConfiguration : IEntityTypeConfiguration<FeatureVisibilityOverride>
{
    public void Configure(EntityTypeBuilder<FeatureVisibilityOverride> builder)
    {
        builder.HasKey(f => f.Id);

        builder.Property(f => f.FeatureId)
            .IsRequired()
            .HasMaxLength(128);

        builder.Property(f => f.VisibleToRoles)
            .HasConversion(
                v => System.Text.Json.JsonSerializer.Serialize(v, (System.Text.Json.JsonSerializerOptions?)null),
                v => System.Text.Json.JsonSerializer.Deserialize<List<string>>(v, (System.Text.Json.JsonSerializerOptions?)null) ?? new List<string>())
            .HasColumnType("text");

        builder.HasOne(f => f.SystemConfiguration)
            .WithMany(c => c.FeatureVisibilityOverrides)
            .HasForeignKey(f => f.SystemConfigurationId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(f => new { f.SystemConfigurationId, f.FeatureId })
            .IsUnique()
            .HasDatabaseName("UQ_FeatureVisibility_Config_Feature");
    }
}
