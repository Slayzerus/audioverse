using AudioVerse.Domain.Entities.Events;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations;

public class EventDateProposalConfiguration : IEntityTypeConfiguration<EventDateProposal>
{
    public void Configure(EntityTypeBuilder<EventDateProposal> builder)
    {
        builder.ToTable("EventDateProposals");
        builder.HasKey(e => e.Id);
        builder.Property(e => e.ProposedStart).IsRequired();
        builder.Property(e => e.Note).HasMaxLength(500);
        builder.HasOne(e => e.Event).WithMany().HasForeignKey(e => e.EventId).IsRequired(false).OnDelete(DeleteBehavior.Cascade);
        builder.HasMany(e => e.Votes).WithOne(v => v.Proposal).HasForeignKey(v => v.ProposalId).OnDelete(DeleteBehavior.Cascade);
    }
}
