using AudioVerse.Domain.Entities.Karaoke.KaraokeSingings;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AudioVerse.Infrastructure.Persistence.Configurations
{
    public class KaraokeSingingConfiguration : IEntityTypeConfiguration<KaraokeSinging>
    {
        public void Configure(EntityTypeBuilder<KaraokeSinging> builder)
        {
            builder.HasOne(s => s.Round)
                .WithMany(r => r.Singing)
                .HasForeignKey(s => s.RoundId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(s => s.RoundPart)
                .WithMany(rp => rp.Singings)
                .HasForeignKey(s => s.RoundPartId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(s => s.Player)
                .WithMany(p => p.LinkedSinging)
                .HasForeignKey(s => s.PlayerId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
