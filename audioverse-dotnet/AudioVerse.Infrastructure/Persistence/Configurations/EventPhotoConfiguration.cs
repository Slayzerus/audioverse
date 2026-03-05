using AudioVerse.Domain.Entities.Events;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations;

public class EventPhotoConfiguration : IEntityTypeConfiguration<EventPhoto>
{
    public void Configure(EntityTypeBuilder<EventPhoto> builder)
    {
        builder.ToTable("EventPhotos");
        builder.HasKey(e => e.Id);
        builder.Property(e => e.ObjectKey).IsRequired().HasMaxLength(500);
        builder.Property(e => e.Caption).HasMaxLength(500);
        builder.HasOne(e => e.Event).WithMany().HasForeignKey(e => e.EventId).IsRequired(false).OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(e => e.EventId);
    }
}
