using AudioVerse.Domain.Entities.UserProfiles;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations
{
    public class MicrophoneAssignmentConfiguration : IEntityTypeConfiguration<MicrophoneAssignment>
    {
        public void Configure(EntityTypeBuilder<MicrophoneAssignment> builder)
        {
            builder.HasOne(d => d.User)
                .WithMany()
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasIndex(d => new { d.UserId, d.Slot })
                .IsUnique();

            builder.HasIndex(d => new { d.UserId, d.MicrophoneId })
                .IsUnique();
        }
    }
}
