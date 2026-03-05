using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Enums.Events;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations
{
    public class EventInviteConfiguration : IEntityTypeConfiguration<EventInvite>
    {
        public void Configure(EntityTypeBuilder<EventInvite> builder)
        {
            builder.HasKey(pi => pi.Id);

            builder.HasIndex(pi => new { pi.EventId, pi.ToUserId })
                .HasDatabaseName("IDX_EventInvite_Event_User");

            builder.Property(pi => pi.Status)
                .HasConversion<int>()
                .HasDefaultValue(EventInviteStatus.Pending);
        }
    }
}
