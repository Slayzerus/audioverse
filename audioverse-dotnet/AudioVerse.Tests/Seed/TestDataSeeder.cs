using AudioVerse.Domain.Entities;
using AudioVerse.Domain.Entities.Admin;
using AudioVerse.Domain.Entities.Editor;
using AudioVerse.Domain.Entities.Karaoke;
using AudioVerse.Domain.Entities.Karaoke.KaraokeSessions;
using AudioVerse.Domain.Entities.Karaoke.KaraokeSongFiles;
using AudioVerse.Domain.Entities.UserProfiles;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Enums;
using AudioVerse.Domain.Enums.Events;
using AudioVerse.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AudioVerse.Tests.Seed
{
    /// <summary>
    /// Provides seed data for integration and unit tests.
    /// </summary>
    public static class TestDataSeeder
    {
        /// <summary>
        /// Seeds core data sets required for most tests.
        /// </summary>
        public static async Task SeedAsync(AudioVerseDbContext db)
        {
            await SeedSystemConfiguration(db);
            await SeedUsers(db);
            await SeedDevices(db);
            await SeedMicrophones(db);
            await SeedKaraoke(db);
            await SeedEditor(db);
        }

        /// <summary>
        /// Seeds karaoke players (based on UserProfilePlayer) and a sample party.
        /// </summary>
        private static async Task SeedKaraoke(AudioVerseDbContext db)
        {
            if (!await db.UserProfilePlayers.AnyAsync())
            {
                var p1 = new UserProfilePlayer { Name = "Singer 1", ProfileId = 2 };
                var p2 = new UserProfilePlayer { Name = "Singer 2", ProfileId = 3 };
                var p3 = new UserProfilePlayer { Name = "Spare Player", ProfileId = 4 };
                db.UserProfilePlayers.AddRange(p1, p2, p3);
                await db.SaveChangesAsync();
            }

            // Create a default development party only if a matching one does not already exist
            // OrganizerId refers to UserProfile.Id (not UserProfilePlayer.Id)
            var organizerPlayer = await db.UserProfilePlayers.FirstOrDefaultAsync();
            if (organizerPlayer != null)
            {
                var organizerUserId = organizerPlayer.ProfileId;
                var exists = await db.Events.AnyAsync(e => e.Title == "DevEvent" || e.OrganizerId == organizerUserId);
                if (!exists)
                {
                    // create Event as the primary aggregate for the party
                    var ev = new Event
                    {
                        Title = "DevEvent",
                        Description = "Najlepsza impreza dla programistów - ?piewamy tylko piosenki o bugach!",
                        Type = EventType.Event,
                        StartTime = DateTime.UtcNow,
                        EndTime = DateTime.UtcNow.AddHours(4),
                        OrganizerId = organizerUserId
                    };
                    db.Add(ev);
                    await db.SaveChangesAsync();

                // create an initial session tied to the Event
                var session = new KaraokeSession { EventId = ev.Id, Name = "Opening Session", CreatedAt = DateTime.UtcNow };
                db.KaraokeSessions.Add(session);
                await db.SaveChangesAsync();

                    // create a sample song so rounds can reference it
                    if (!await db.KaraokeSongs.AnyAsync())
                    {
                        var song = new KaraokeSongFile { Title = "Test Song", Artist = "Test Artist", Genre = "Pop", Language = "EN", Year = "2025", Format = AudioVerse.Domain.Enums.KaraokeFormat.Ultrastar };
                        db.KaraokeSongs.Add(song);
                        await db.SaveChangesAsync();
                    }

                    // create a round within the session for round-player tests
                    var sampleSong = await db.KaraokeSongs.FirstAsync();
                    var round = new KaraokeSessionRound { EventId = null, SessionId = session.Id, SongId = sampleSong.Id, Number = 1, CreatedAt = DateTime.UtcNow };
                    db.KaraokeEventRounds.Add(round);
                    await db.SaveChangesAsync();

                    // sample invite
                    var invite = new EventInvite { EventId = ev.Id, FromUserId = organizerUserId, ToEmail = "guest@example.com", Message = "Join DevEvent", CreatedAt = DateTime.UtcNow };
                    db.EventInvites.Add(invite);

                    // assign players as event participants so permission tests work (keep one spare for AddParticipant tests)
                    var players = await db.UserProfilePlayers.OrderBy(p => p.Id).Take(2).ToListAsync();
                    foreach (var pl in players)
                    {
                        if (!await db.KaraokeEventPlayers.AnyAsync(pp => pp.EventId == ev.Id && pp.PlayerId == pl.Id))
                        {
                            db.KaraokeEventPlayers.Add(new KaraokeSessionPlayer
                            {
                                EventId = ev.Id,
                                PlayerId = pl.Id,
                                Status = KaraokePlayerStatus.Inside,
                                Permissions = EventPermission.None
                            });
                        }
                    }

                    await db.SaveChangesAsync();
                }
            }
        }

        /// <summary>
        /// Seeds default system configuration if missing.
        /// </summary>
        private static async Task SeedSystemConfiguration(AudioVerseDbContext db)
        {
            if (!await db.SystemConfigurations.AnyAsync())
            {
                db.SystemConfigurations.Add(new SystemConfiguration
                {
                    SessionTimeoutMinutes = 30,
                    CaptchaOption = CaptchaOption.Type1,
                    MaxMicrophonePlayers = 4,
                    Active = true,
                    ModifiedAt = DateTime.UtcNow,
                    ModifiedByUsername = "seed"
                });
                await db.SaveChangesAsync();
            }
        }

        /// <summary>
        /// Seeds demo users if missing.
        /// </summary>
        private static async Task SeedUsers(AudioVerseDbContext db)
        {
            if (!await db.Users.AnyAsync())
            {
                db.Users.AddRange(
                    new UserProfile { Id = 1, UserName = "admin", Email = "admin@test.com" },
                    new UserProfile { Id = 2, UserName = "user1", Email = "user1@test.com" },
                    new UserProfile { Id = 3, UserName = "user2", Email = "user2@test.com" },
                    new UserProfile { Id = 4, UserName = "user3", Email = "user3@test.com" }
                );
                await db.SaveChangesAsync();
            }
        }

        /// <summary>
        /// Seeds user devices.
        /// </summary>
        private static async Task SeedDevices(AudioVerseDbContext db)
        {
            if (!await db.UserDevices.AnyAsync())
            {
                db.UserDevices.AddRange(
                    new UserProfileDevice { UserId = 2, DeviceId = "kbd-1", DeviceType = DeviceType.Keyboard, Visible = true },
                    new UserProfileDevice { UserId = 2, DeviceId = "pad-1", DeviceType = DeviceType.Gamepad, Visible = true }
                );
                await db.SaveChangesAsync();
            }
        }

        /// <summary>
        /// Seeds microphones and assignments.
        /// </summary>
        private static async Task SeedMicrophones(AudioVerseDbContext db)
        {
            if (!await db.UserMicrophones.AnyAsync())
            {
                db.UserMicrophones.AddRange(
                    new UserProfileMicrophone { UserId = 2, DeviceId = "mic-1", Volume = 90, Threshold = 5, Visible = true },
                    new UserProfileMicrophone { UserId = 3, DeviceId = "mic-2", Volume = 80, Threshold = 3, Visible = true }
                );
                await db.SaveChangesAsync();
            }

            if (!await db.MicrophoneAssignments.AnyAsync())
            {
                db.MicrophoneAssignments.AddRange(
                    new MicrophoneAssignment { UserId = 2, MicrophoneId = "mic-1", Color = "#FF0000", Slot = 0 },
                    new MicrophoneAssignment { UserId = 3, MicrophoneId = "mic-2", Color = "#00FF00", Slot = 1 }
                );
                await db.SaveChangesAsync();
            }
        }

        /// <summary>
        /// Seeds a sample editor project with sections and layers.
        /// </summary>
        private static async Task SeedEditor(AudioVerseDbContext db)
        {
            if (!await db.AudioProjects.AnyAsync())
            {
                var project = new AudioProject
                {
                    Name = "Sample Project",
                    Volume = 100,
                    IsTemplate = false,
                    Sections = new List<AudioSection>
                    {
                        new AudioSection
                        {
                            Name = "Intro",
                            OrderNumber = 1,
                            Duration = TimeSpan.FromSeconds(30),
                            BPM = 120,
                            Layers = new List<AudioLayer>
                            {
                                new AudioLayer
                                {
                                    Name = "Drums",
                                    Volume = 90,
                                    Items = new List<AudioLayerItem>
                                    {
                                        new AudioLayerItem { StartTime = TimeSpan.Zero, Parameters = "kick" }
                                    }
                                }
                            }
                        }
                    }
                };
                db.AudioProjects.Add(project);
                await db.SaveChangesAsync();
            }
        }

        /// <summary>
        /// Seeds audit log entries.
        /// </summary>
        private static async Task SeedAuditLogs(AudioVerseDbContext db)
        {
            if (!await db.AuditLogs.AnyAsync())
            {
                db.AuditLogs.AddRange(
                    new AuditLog { UserId = 2, Username = "user1", Action = "Login", Description = "Successful login", Success = true, Timestamp = DateTime.UtcNow.AddMinutes(-5) },
                    new AuditLog { UserId = 3, Username = "user2", Action = "ChangePassword", Description = "Changed password", Success = true, Timestamp = DateTime.UtcNow.AddMinutes(-3) },
                    new AuditLog { UserId = 2, Username = "user1", Action = "Login", Description = "Failed login", Success = false, ErrorMessage = "Bad password", Timestamp = DateTime.UtcNow.AddMinutes(-1) }
                );
                await db.SaveChangesAsync();
            }
        }

        /// <summary>
        /// Seeds core data plus audit logs.
        /// </summary>
        public static async Task SeedWithAuditAsync(AudioVerseDbContext db)
        {
            await SeedAsync(db);
            await SeedAuditLogs(db);
        }
    }
}
