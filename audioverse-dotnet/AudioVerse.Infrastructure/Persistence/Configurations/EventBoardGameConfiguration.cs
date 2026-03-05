using AudioVerse.Domain.Entities.Events;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations;

public class EventBoardGameConfiguration : IEntityTypeConfiguration<EventBoardGameSession>
{
    public void Configure(EntityTypeBuilder<EventBoardGameSession> builder)
    {
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Status).HasConversion<int>();
        builder.HasOne(e => e.BoardGame).WithMany().HasForeignKey(e => e.BoardGameId).OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(e => new { e.EventId, e.BoardGameId }).HasDatabaseName("IDX_EventBoardGame_EG");
    }
}
