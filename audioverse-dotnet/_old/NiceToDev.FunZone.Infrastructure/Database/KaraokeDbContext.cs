using Microsoft.EntityFrameworkCore;
using NiceToDev.FunZone.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace NiceToDev.FunZone.Infrastructure.Database
{
    public class KaraokeDbContext : DbContext
    {
        public KaraokeDbContext(DbContextOptions<KaraokeDbContext> options) : base(options) { }

        public DbSet<KaraokeParty> KaraokeParties { get; set; }
        public DbSet<KaraokePlayer> KaraokePlayers { get; set; }
        public DbSet<KaraokePlaylist> KaraokePlaylists { get; set; }
        public DbSet<KaraokeSongFile> KaraokeSongs { get; set; }
        public DbSet<KaraokeSingingRecording> KaraokeRecordings { get; set; }


        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<KaraokeParty>()
                .HasOne(p => p.Organizer)
                .WithMany(p => p.OrganizedParties)
                .HasForeignKey(p => p.OrganizerId)
                .OnDelete(DeleteBehavior.Restrict);

            // 🔹 Many-to-Many (KaraokeParty <-> KaraokePlayer)
            modelBuilder.Entity<KaraokeParty>()
                .HasMany(p => p.Players)
                .WithMany(p => p.Parties)
                .UsingEntity<Dictionary<string, object>>(
                    "KaraokePartyKaraokePlayer",
                    j => j.HasOne<KaraokePlayer>().WithMany().HasForeignKey("PlayersId").OnDelete(DeleteBehavior.NoAction), // 🚨 Zmieniamy z CASCADE na NO ACTION
                    j => j.HasOne<KaraokeParty>().WithMany().HasForeignKey("PartiesId").OnDelete(DeleteBehavior.Cascade)
                );

            modelBuilder.Entity<KaraokePartyPlayer>()
                .HasKey(pp => new { pp.PartyId, pp.PlayerId });

            modelBuilder.Entity<KaraokePartyPlayer>()
                .HasOne(kpp => kpp.Party)
                .WithMany(p => p.PartyPlayers)
                .HasForeignKey(kpp => kpp.PartyId)
                .OnDelete(DeleteBehavior.Restrict); // 🚨 Zmienione na Restrict

            modelBuilder.Entity<KaraokePartyPlaylist>()
                .HasKey(pp => new { pp.PartyId, pp.PlaylistId });

            modelBuilder.Entity<KaraokePlaylistSong>()
                .HasKey(pp => new { pp.PlaylistId, pp.SongId });

            modelBuilder.Entity<KaraokeSinging>()
                .HasKey(s => new { s.PlayerId, s.RoundId });

            modelBuilder.Entity<KaraokeSinging>()
            .HasOne(s => s.Player)
            .WithMany(s => s.Singing)
            .HasForeignKey(s => s.PlayerId)
            .OnDelete(DeleteBehavior.NoAction); // 🚨 Tu zmiana!

            // 🔹 Relacja KaraokePartyRound -> KaraokePlayer (ZAMIENIAMY CASCADE NA NO ACTION)
            modelBuilder.Entity<KaraokePartyRound>()
                .HasOne(r => r.Player)
                .WithMany(r => r.Rounds)
                .HasForeignKey(r => r.PlayerId)
                .OnDelete(DeleteBehavior.NoAction); // 🚨 Tu zmiana!
        }
    }
}
