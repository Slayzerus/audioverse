using AudioVerse.Domain.Entities.Karaoke.KaraokeSessions;
using AudioVerse.Domain.Entities.Karaoke.KaraokeSingings;
using AudioVerse.Domain.Entities.UserProfiles;
using AudioVerse.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AudioVerse.API.Seed;

/// <summary>
/// Seeduje 9 graczy „demo" (pod kontem admina) i po 9 wyników punktowych
/// do każdej piosenki, która jeszcze nie ma żadnych wyników (KaraokeSinging).
/// Idempotentny — nie duplikuje danych przy ponownym uruchomieniu.
/// </summary>
public static class KaraokeScoringSeeder
{
    private const int DemoPlayerCount = 9;

    private static readonly string[] PlayerNames =
    [
        "Bartek", "Radek", "Krzysiek", "Ewa", "Kamil",
        "Jacek", "Olga", "Robert", "Adam"
    ];

    private static readonly string[] PlayerColors =
    [
        "#e94560", "#1565c0", "#2e7d32", "#ef6c00", "#8e24aa",
        "#00897b", "#d81b60", "#3949ab", "#f9a825"
    ];

    private static readonly string[] PlayerIcons =
    [
        "fa-microphone", "fa-music", "fa-guitar", "fa-headphones", "fa-drum",
        "fa-compact-disc", "fa-star", "fa-bolt", "fa-fire"
    ];

    public static async Task SeedAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AudioVerseDbContext>();

        // 1. Znajdź admina
        var admin = await db.Users.FirstOrDefaultAsync(u => u.UserName == "admin");
        if (admin is null)
        {
            Console.WriteLine("🎤 KaraokeScoringSeeder: brak użytkownika admin — pomijam.");
            return;
        }

        // 2. Upewnij się, że istnieje 9 graczy demo pod adminem
        var existingPlayers = await db.UserProfilePlayers
            .Where(p => p.ProfileId == admin.Id)
            .ToListAsync();

        var demoPlayers = new List<UserProfilePlayer>();
        for (var i = 0; i < DemoPlayerCount; i++)
        {
            var name = PlayerNames[i];
            var existing = existingPlayers.FirstOrDefault(p => p.Name == name);
            if (existing is not null)
            {
                demoPlayers.Add(existing);
            }
            else
            {
                var player = new UserProfilePlayer
                {
                    Name = name,
                    ProfileId = admin.Id,
                    IsPrimary = false,
                    PreferredColors = PlayerColors[i],
                    FillPattern = "Pill",
                    Icon = PlayerIcons[i],
                };
                db.UserProfilePlayers.Add(player);
                demoPlayers.Add(player);
            }
        }

        if (demoPlayers.Any(p => p.Id == 0))
        {
            await db.SaveChangesAsync();
            Console.WriteLine($"🎤 Utworzono {demoPlayers.Count(p => p.Id > 0)} graczy demo.");
        }

        // 3. Znajdź piosenki bez wyników
        var songIdsWithScores = await db.KaraokeSingings
            .Select(s => s.Round!.SongId)
            .Distinct()
            .ToListAsync();

        var songsWithoutScores = await db.KaraokeSongs
            .Where(s => !songIdsWithScores.Contains(s.Id))
            .Select(s => s.Id)
            .ToListAsync();

        if (songsWithoutScores.Count == 0)
        {
            Console.WriteLine("🎤 Wszystkie piosenki mają już wyniki — pomijam seed.");
            return;
        }

        Console.WriteLine($"🎤 Seeduję wyniki dla {songsWithoutScores.Count} piosenek...");

        // 4. Znajdź sesję lub utwórz
        var session = await db.KaraokeSessions.FirstOrDefaultAsync();
        int? sessionId = session?.Id;
        int? eventId = session?.EventId;

        if (session is null)
        {
            var ev = await db.Events.FirstOrDefaultAsync();
            eventId = ev?.Id;

            var newSession = new KaraokeSession
            {
                EventId = eventId,
                Name = "Demo Scoring Session",
                CreatedAt = DateTime.UtcNow,
                StartedAt = DateTime.UtcNow
            };
            db.KaraokeSessions.Add(newSession);
            await db.SaveChangesAsync();
            sessionId = newSession.Id;
        }

        // 5. Dla każdej piosenki utwórz rundę + 9 wyników
        var rng = new Random(42);
        var roundNumber = (await db.KaraokeEventRounds
            .Where(r => r.SessionId == sessionId)
            .MaxAsync(r => (int?)r.Number)) ?? 0;

        foreach (var songId in songsWithoutScores)
        {
            roundNumber++;
            var round = new KaraokeSessionRound
            {
                SessionId = sessionId,
                EventId = eventId,
                SongId = songId,
                Number = roundNumber,
                CreatedAt = DateTime.UtcNow,
                PerformedAt = DateTime.UtcNow.AddMinutes(-rng.Next(1, 1440))
            };
            db.KaraokeEventRounds.Add(round);
            await db.SaveChangesAsync();

            for (var i = 0; i < DemoPlayerCount; i++)
            {
                var score = rng.Next(2000, 9800);
                var total = rng.Next(80, 200);
                var perfect = (int)(total * rng.NextDouble() * 0.4);
                var good = (int)((total - perfect) * rng.NextDouble() * 0.5);
                var hits = perfect + good + rng.Next(0, total - perfect - good);
                var misses = total - hits;
                var combo = rng.Next(5, Math.Max(6, hits));

                db.KaraokeSingings.Add(new KaraokeSinging
                {
                    RoundId = round.Id,
                    PlayerId = demoPlayers[i].Id,
                    Score = score,
                    Hits = hits,
                    Misses = misses,
                    Good = good,
                    Perfect = perfect,
                    Combo = combo
                });
            }
        }

        await db.SaveChangesAsync();
        Console.WriteLine($"🎤 Zaseedowano {songsWithoutScores.Count * DemoPlayerCount} wyników " +
                          $"dla {songsWithoutScores.Count} piosenek.");
    }
}
