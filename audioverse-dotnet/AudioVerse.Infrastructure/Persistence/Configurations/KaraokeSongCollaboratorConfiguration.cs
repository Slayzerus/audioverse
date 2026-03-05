using AudioVerse.Domain.Entities.Karaoke.KaraokeSongFiles;
using AudioVerse.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations;

public class KaraokeSongCollaboratorConfiguration : IEntityTypeConfiguration<KaraokeSongFileCollaborator>
{
    public void Configure(EntityTypeBuilder<KaraokeSongFileCollaborator> builder)
    {
        builder.HasKey(c => new { c.SongId, c.UserId });

        builder.HasOne(c => c.Song)
            .WithMany()
            .HasForeignKey(c => c.SongId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Property(c => c.Permission)
            .HasDefaultValue(CollaborationPermission.Read);
    }
}
