using AudioVerse.Domain.Entities.Events;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations;

public class EventDateVoteConfiguration : IEntityTypeConfiguration<EventDateVote>
{
    public void Configure(EntityTypeBuilder<EventDateVote> builder)
    {
        builder.ToTable("EventDateVotes");
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Comment).HasMaxLength(300);
        builder.HasIndex(e => new { e.ProposalId, e.UserId }).IsUnique();
    }
}
