using AudioVerse.Domain.Entities.Audio;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations;

public class PlaylistItemConfiguration : IEntityTypeConfiguration<PlaylistItem>
{
    public void Configure(EntityTypeBuilder<PlaylistItem> builder)
    {
        builder.ToTable("PlaylistItems");
        builder.HasKey(i => i.Id);
        builder.Property(i => i.OrderNumber).IsRequired();
        builder.HasOne(i => i.Song).WithMany().HasForeignKey(i => i.SongId).IsRequired(false).OnDelete(DeleteBehavior.Cascade);
    }
}
