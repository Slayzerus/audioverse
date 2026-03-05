using AudioVerse.Domain.Entities.Events;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations;

public class EventPollResponseConfiguration : IEntityTypeConfiguration<EventPollResponse>
{
    public void Configure(EntityTypeBuilder<EventPollResponse> builder)
    {
        builder.HasKey(e => e.Id);
        builder.HasOne(e => e.Option).WithMany().HasForeignKey(e => e.OptionId).OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(e => new { e.PollId, e.RespondentEmail }).HasDatabaseName("IDX_PollResponse_Respondent");
    }
}
