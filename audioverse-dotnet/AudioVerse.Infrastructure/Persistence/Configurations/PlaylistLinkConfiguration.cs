using AudioVerse.Domain.Entities.Audio;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations;

public class PlaylistLinkConfiguration : IEntityTypeConfiguration<PlaylistLink>
{
    public void Configure(EntityTypeBuilder<PlaylistLink> builder)
    {
        builder.ToTable("PlaylistLinks");
        builder.HasKey(l => new { l.SourcePlaylistId, l.TargetPlaylistId });
        builder.HasOne(l => l.SourcePlaylist).WithMany(p => p.Links).HasForeignKey(l => l.SourcePlaylistId);
        builder.HasOne(l => l.TargetPlaylist).WithMany().HasForeignKey(l => l.TargetPlaylistId).OnDelete(DeleteBehavior.Restrict);
    }
}
