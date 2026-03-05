using AudioVerse.Domain.Entities.Events;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations;

public class EventSessionSongSignupConfiguration : IEntityTypeConfiguration<EventSessionSongSignup>
{
    public void Configure(EntityTypeBuilder<EventSessionSongSignup> builder)
    {
        builder.ToTable("EventSessionSongSignups");
        builder.HasKey(e => e.Id);
        builder.HasIndex(e => new { e.PickId, e.UserId }).IsUnique();
    }
}
