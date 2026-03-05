using AudioVerse.Domain.Entities.Events;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations;

public class EventVideoGameConfiguration : IEntityTypeConfiguration<EventVideoGameSession>
{
    public void Configure(EntityTypeBuilder<EventVideoGameSession> builder)
    {
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Status).HasConversion<int>();
        builder.HasOne(e => e.VideoGame).WithMany().HasForeignKey(e => e.VideoGameId).OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(e => new { e.EventId, e.VideoGameId }).HasDatabaseName("IDX_EventVideoGame_EG");
    }
}
