using AudioVerse.Domain.Entities.Admin;
using AudioVerse.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations;

public class SystemConfigurationConfiguration : IEntityTypeConfiguration<SystemConfiguration>
{
    public void Configure(EntityTypeBuilder<SystemConfiguration> builder)
    {
        builder.HasData(new SystemConfiguration
        {
            Id = 1,
            SessionTimeoutMinutes = 30,
            CaptchaOption = CaptchaOption.Type1,
            MaxMicrophonePlayers = 4,
            Active = true,
            ModifiedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc),
            ModifiedByUserId = null,
            ModifiedByUsername = "system"
        });
    }
}
