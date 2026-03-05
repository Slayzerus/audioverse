using AudioVerse.Domain.Entities.UserProfiles;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations
{
    public class UserProfileDeviceConfiguration : IEntityTypeConfiguration<UserProfileDevice>
    {
        public void Configure(EntityTypeBuilder<UserProfileDevice> builder)
        {
            builder.HasOne(d => d.User)
                .WithMany()
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasIndex(d => new { d.UserId, d.DeviceId })
                .IsUnique();
        }
    }
}
