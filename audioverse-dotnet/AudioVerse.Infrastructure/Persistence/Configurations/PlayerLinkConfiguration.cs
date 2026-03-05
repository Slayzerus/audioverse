using AudioVerse.Domain.Entities.UserProfiles;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations
{
    public class PlayerLinkConfiguration : IEntityTypeConfiguration<PlayerLink>
    {
        public void Configure(EntityTypeBuilder<PlayerLink> builder)
        {
            builder.HasOne(l => l.SourcePlayer)
                .WithMany(p => p.OutgoingLinks)
                .HasForeignKey(l => l.SourcePlayerId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(l => l.TargetPlayer)
                .WithMany(p => p.IncomingLinks)
                .HasForeignKey(l => l.TargetPlayerId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Property(l => l.Scope).HasConversion<int>();
            builder.Property(l => l.Status).HasConversion<int>();

            builder.HasIndex(l => new { l.SourcePlayerId, l.TargetPlayerId })
                .IsUnique();
        }
    }
}
