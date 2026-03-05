using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using OpenIddict.EntityFrameworkCore.Models;
using AudioVerse.Domain.Entities.UserProfiles;
using AudioVerse.Domain.Entities.Audio;
using AudioVerse.Domain.Entities.Karaoke.KaraokePlayLists;
using AudioVerse.Domain.Entities.Karaoke.KaraokeSessions;

namespace AudioVerse.IdentityServer.Persistence
{
    public class IdentityDbContext : IdentityDbContext<UserProfile, IdentityRole<int>, int>
    {
        public IdentityDbContext(DbContextOptions<IdentityDbContext> options) : base(options) { }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            builder.UseOpenIddict(); // 🔥 Konfiguracja OpenIddict w bazie

            // JSON value objects — stored as serialized text in UserProfilePlayer.KaraokeSettings
            builder.Ignore<KaraokeSettings>();
            builder.Ignore<KaraokeBarFill>();
            builder.Ignore<KaraokeFontSettings>();

            // Ensure shared domain karaoke types have keys configured when this Identity DbContext scans the model.
            // IdentityDbContext includes UserProfile which has navigations to UserProfilePlayer -> Karaoke entities,
            // so define composite keys for join entities to avoid EF requiring keys at runtime.
            builder.Entity<KaraokeSessionPlayer>().HasKey(kpp => kpp.Id);
            builder.Entity<KaraokePlaylistSong>().HasKey(ps => new { ps.PlaylistId, ps.SongId });

            // Audio join entities discovered via KaraokeSongFile.LinkedSong -> Song -> Album -> AlbumArtists
            builder.Entity<AlbumArtist>().HasKey(aa => new { aa.AlbumId, aa.ArtistId });

            // UserProfile 1:1 Contact (self-entry card) — explicit FK, no inverse nav on Contact
            builder.Entity<UserProfile>()
                .HasOne(u => u.Contact)
                .WithOne()
                .HasForeignKey<UserProfile>(u => u.ContactId)
                .OnDelete(DeleteBehavior.SetNull);
        }
    }
}
