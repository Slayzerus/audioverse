using AudioVerse.Domain.Entities.Events;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations;

public class EventSessionGameVoteConfiguration : IEntityTypeConfiguration<EventSessionGameVote>
{
    public void Configure(EntityTypeBuilder<EventSessionGameVote> builder)
    {
        builder.ToTable("EventSessionGameVotes");
        builder.HasKey(e => e.Id);
        builder.HasIndex(e => new { e.PickId, e.UserId }).IsUnique();
    }
}
