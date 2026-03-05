using AudioVerse.Domain.Entities.Audio;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations;

public class PlaylistConfiguration : IEntityTypeConfiguration<Playlist>
{
    public void Configure(EntityTypeBuilder<Playlist> builder)
    {
        builder.ToTable("Playlists");
        builder.HasKey(p => p.Id);
        builder.Property(p => p.Name).IsRequired().HasMaxLength(200);
        builder.Property(p => p.Description).HasMaxLength(1000);
        builder.HasMany(p => p.Items).WithOne(i => i.Playlist).HasForeignKey(i => i.PlaylistId);
        builder.HasMany(p => p.Links).WithOne(l => l.SourcePlaylist).HasForeignKey(l => l.SourcePlaylistId);
        builder.HasMany(p => p.Children).WithOne(p => p.Parent).HasForeignKey(p => p.ParentId).OnDelete(DeleteBehavior.Restrict);
    }
}
