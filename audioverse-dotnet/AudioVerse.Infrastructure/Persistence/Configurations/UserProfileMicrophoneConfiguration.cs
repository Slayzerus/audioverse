using AudioVerse.Domain.Entities.UserProfiles;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations
{
    public class UserProfileMicrophoneConfiguration : IEntityTypeConfiguration<UserProfileMicrophone>
    {
        public void Configure(EntityTypeBuilder<UserProfileMicrophone> builder)
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
