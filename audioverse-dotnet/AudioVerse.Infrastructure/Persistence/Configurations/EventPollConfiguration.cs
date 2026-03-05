using AudioVerse.Domain.Entities.Events;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations;

public class EventPollConfiguration : IEntityTypeConfiguration<EventPoll>
{
    public void Configure(EntityTypeBuilder<EventPoll> builder)
    {
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Type).HasConversion<int>();
        builder.Property(e => e.OptionSource).HasConversion<int>();
        builder.HasIndex(e => e.Token).IsUnique().HasDatabaseName("UQ_Poll_Token");
        builder.HasIndex(e => e.EventId).HasDatabaseName("IDX_Poll_Event");
        builder.HasMany(e => e.Options).WithOne().HasForeignKey(o => o.PollId).OnDelete(DeleteBehavior.Cascade);
        builder.HasMany(e => e.Responses).WithOne().HasForeignKey(r => r.PollId).OnDelete(DeleteBehavior.Cascade);
    }
}
