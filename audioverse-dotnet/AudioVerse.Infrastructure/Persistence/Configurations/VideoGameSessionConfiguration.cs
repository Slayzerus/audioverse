using AudioVerse.Domain.Entities.Games;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations;

public class VideoGameSessionConfiguration : IEntityTypeConfiguration<VideoGameSession>
{
    public void Configure(EntityTypeBuilder<VideoGameSession> builder)
    {
        builder.HasKey(e => e.Id);
        builder.HasOne(e => e.Event).WithMany().HasForeignKey(e => e.EventId).IsRequired(false).OnDelete(DeleteBehavior.Cascade);
    }
}
