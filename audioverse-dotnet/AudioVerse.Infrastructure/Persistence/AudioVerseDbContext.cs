using Microsoft.EntityFrameworkCore;
using AudioVerse.Domain.Entities;
using AudioVerse.Domain.Entities.Karaoke;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using AudioVerse.Domain.Entities.Editor;

namespace AudioVerse.Infrastructure.Persistence
{
    public class AudioVerseDbContext : IdentityDbContext<
        UserProfile,
        IdentityRole<int>,
        int,
        IdentityUserClaim<int>,
        IdentityUserRole<int>,
        IdentityUserLogin<int>,
        IdentityRoleClaim<int>,
        IdentityUserToken<int>>
    {
        public AudioVerseDbContext(DbContextOptions<AudioVerseDbContext> options) : base(options) { }

        public DbSet<UserProfile> UserProfiles { get; set; }
        public DbSet<UserProfilePlayer> UserProfilePlayers { get; set; }



        public DbSet<KaraokeParty> KaraokeParties { get; set; }
        public DbSet<KaraokePlayer> KaraokePlayers { get; set; }
        public DbSet<KaraokeSongFile> KaraokeSongs { get; set; }
        public DbSet<KaraokePlaylist> KaraokePlaylists { get; set; }
        public DbSet<KaraokePartyPlayer> KaraokePartyPlayers { get; set; }
        public DbSet<KaraokePartyRound> KaraokePartyRounds { get; set; }
        public DbSet<KaraokeSinging> KaraokeSingings { get; set; }



        public DbSet<AudioProject> AudioProjects { get; set; }
        public DbSet<AudioSection> AudioSections { get; set; }
        public DbSet<AudioLayer> AudioLayers { get; set; }
        public DbSet<AudioLayerItem> AudioLayerItems { get; set; }
        public DbSet<AudioClip> AudioClips { get; set; }
        public DbSet<AudioClipTag> AudioClipTags { get; set; }
        public DbSet<AudioInputPreset> AudioInputPresets { get; set; }
        public DbSet<AudioInputMapping> AudioInputMappings { get; set; }


        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // 🔹 Relacja UserProfile → UserProfilePlayers (1 do wielu)
            modelBuilder.Entity<UserProfile>()
                .HasMany(u => u.Players)
                .WithOne(p => p.Profile)
                .HasForeignKey(p => p.ProfileId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<KaraokeParty>()
                .HasOne(kp => kp.Organizer)
                .WithMany()  // Jeśli użytkownik może organizować wiele imprez
                .HasForeignKey(kp => kp.OrganizerId)  // Klucz obcy
                .OnDelete(DeleteBehavior.Restrict);  // Zapobiega kaskadowemu usunięciu

            modelBuilder.Entity<KaraokeParty>()
                .HasOne(kp => kp.Organizer) // Impreza ma jednego organizatora
                .WithMany(kp => kp.OrganizedParties) // Organizator może mieć wiele imprez
                .HasForeignKey(kp => kp.OrganizerId); // Klucz obcy

            modelBuilder.Entity<KaraokePartyPlaylist>()
                .HasKey(kpp => new { kpp.PartyId, kpp.PlaylistId });  // Klucz złożony

            modelBuilder.Entity<KaraokePartyPlayer>()
                .HasOne(p => p.Player)
                .WithMany(p => p.PartyPlayers)
                .HasForeignKey(p => p.PlayerId);

            modelBuilder.Entity<KaraokePartyPlayer>()
                .HasOne(p => p.Party)
                .WithMany(p => p.PartyPlayers)
                .HasForeignKey(p => p.PartyId);
            /*
                        modelBuilder.Entity<KaraokePlayer>()
                            .HasMany(p => p.PartyPlayers)
                            .WithOne(p => p.Player)
                            .HasForeignKey(p => p.PartyId);

                        modelBuilder.Entity<KaraokeParty>()
                            .HasMany(p => p.PartyPlayers)
                            .WithOne(p => p.Party)
                            .HasForeignKey(p => p.PartyId);*/

            // 🔹 Relacja KaraokeParty → KaraokePlayer (Wielu do wielu)
            modelBuilder.Entity<KaraokePartyPlayer>()
                .HasKey(kpp => new { kpp.PartyId, kpp.PlayerId });
            /*
                        modelBuilder.Entity<KaraokePartyPlayer>()
                            .HasOne(kpp => kpp.Party)
                            .WithMany(p => p.PartyPlayers)
                            .HasForeignKey(kpp => kpp.PartyId)
                            .OnDelete(DeleteBehavior.Restrict);

                        modelBuilder.Entity<KaraokePartyPlayer>()
                            .HasOne(kpp => kpp.Player)
                            .WithMany(p => p.KaraokePartyPlayers)
                            .HasForeignKey(kpp => kpp.PlayerId)
                            .OnDelete(DeleteBehavior.Cascade);*/

            // 🔹 Relacja KaraokePartyRound → KaraokePlayer (1 do wielu)
            modelBuilder.Entity<KaraokePartyRound>()
                .HasOne(r => r.Player)
                .WithMany(p => p.Rounds)
                .HasForeignKey(r => r.PlayerId)
                .OnDelete(DeleteBehavior.Restrict);

            // 🔹 Relacja KaraokeSinging → KaraokePartyRound (1 do wielu)
            modelBuilder.Entity<KaraokeSinging>()
                .HasOne(s => s.Round)
                .WithMany(r => r.Singing)
                .HasForeignKey(s => s.RoundId)
                .OnDelete(DeleteBehavior.Cascade);

            // 🔹 Relacja KaraokeSinging → KaraokePlayer (1 do wielu)
            modelBuilder.Entity<KaraokeSinging>()
                .HasOne(s => s.Player)
                .WithMany(p => p.Singing)
                .HasForeignKey(s => s.PlayerId)
                .OnDelete(DeleteBehavior.Restrict);

            // 🔹 Relacja KaraokePlaylist → KaraokeSongFile (wiele do wielu)
            modelBuilder.Entity<KaraokePlaylistSong>()
                .HasKey(ps => new { ps.PlaylistId, ps.SongId });

            modelBuilder.Entity<KaraokePlaylistSong>()
                .HasOne(ps => ps.Playlist)
                .WithMany(p => p.PlaylistSongs)
                .HasForeignKey(ps => ps.PlaylistId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<KaraokePlaylistSong>()
                .HasOne(ps => ps.Song)
                .WithMany()
                .HasForeignKey(ps => ps.SongId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<KaraokeSongFile>()
                .HasMany(s => s.Notes)
                .WithOne()
                .HasForeignKey(ps => ps.SongId);



            modelBuilder.Entity<AudioProject>()
                .HasMany(ap => ap.Sections)
                .WithOne()
                .HasForeignKey(s => s.ProjectId);

            modelBuilder.Entity<AudioSection>()
                .HasMany(s => s.Layers)
                .WithOne()
                .HasForeignKey(l => l.SectionId);

            modelBuilder.Entity<AudioSection>()
                .HasMany(s => s.InputMappings)
                .WithOne()
                .HasForeignKey(l => l.SectionId);

            modelBuilder.Entity<AudioLayer>()
                .HasMany(l => l.Items)
                .WithOne()
                .HasForeignKey(e => e.LayerId);

            modelBuilder.Entity<AudioLayer>()
                .HasMany(l => l.InputMappings)
                .WithOne()
                .HasForeignKey(e => e.LayerId);

            modelBuilder.Entity<AudioLayer>()
                .HasOne(l => l.AudioClip)
                .WithMany()
                .HasForeignKey(e => e.AudioClipId);

            modelBuilder.Entity<AudioLayer>()
                .HasMany(l => l.Items)
                .WithOne()
                .HasForeignKey(e => e.LayerId);

            modelBuilder.Entity<AudioClip>()
                .HasMany(l => l.Tags)
                .WithOne()
                .HasForeignKey(e => e.AudioClipId);

            modelBuilder.Entity<AudioClipTag>()
                .HasKey(ps => new { ps.AudioClipId, ps.Tag });

            modelBuilder.Entity<AudioInputPreset>()
                .HasMany(p => p.Layers)
                .WithOne()
                .HasForeignKey(l => l.InputPresetId);

            modelBuilder.Entity<IdentityUserLogin<int>>().HasKey(iul => new { iul.LoginProvider, iul.ProviderKey });
            modelBuilder.Entity<IdentityUserRole<int>>().HasKey(iur => new { iur.UserId, iur.RoleId });
            modelBuilder.Entity<IdentityUserToken<int>>().HasKey(iut => new { iut.UserId, iut.LoginProvider, iut.Name });

            modelBuilder.UseOpenIddict();
        }
    }
}
