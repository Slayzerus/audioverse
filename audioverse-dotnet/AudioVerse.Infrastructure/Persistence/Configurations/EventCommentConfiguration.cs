using AudioVerse.Domain.Entities.Events;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations;

public class EventCommentConfiguration : IEntityTypeConfiguration<EventComment>
{
    public void Configure(EntityTypeBuilder<EventComment> builder)
    {
        builder.ToTable("EventComments");
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Text).IsRequired().HasMaxLength(2000);
        builder.HasOne(e => e.Event).WithMany().HasForeignKey(e => e.EventId).IsRequired(false).OnDelete(DeleteBehavior.Cascade);
        builder.HasMany(e => e.Replies).WithOne(e => e.Parent).HasForeignKey(e => e.ParentId).OnDelete(DeleteBehavior.Restrict);
        builder.HasIndex(e => e.EventId);
    }
}
