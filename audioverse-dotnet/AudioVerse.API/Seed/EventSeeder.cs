using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Enums;
using AudioVerse.Domain.Enums.Events;
using AudioVerse.Infrastructure.Persistence;
using AudioVerse.Infrastructure.Storage;
using Microsoft.EntityFrameworkCore;

namespace AudioVerse.API.Seed;

public static class EventSeeder
{
    private const string PosterBucket = "ev-posters";

    public static async Task SeedDefaultEventAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AudioVerseDbContext>();
        var storage = scope.ServiceProvider.GetRequiredService<IFileStorage>();

        if (await db.Events.AnyAsync())
        {
            Console.WriteLine("🎉 Events already exist — skipping seed.");
            return;
        }

        Console.WriteLine("🎉 Seeding default karaoke event...");

        // Upload poster to MinIO
        string? posterKey = null;
        var posterFile = Path.Combine(AppContext.BaseDirectory, "Seed", "Ultrastar", "poster.jpg");
        if (File.Exists(posterFile))
        {
            try
            {
                posterKey = $"posters/{Guid.NewGuid()}.jpg";
                await storage.EnsureBucketExistsAsync(PosterBucket);
                var bytes = await File.ReadAllBytesAsync(posterFile);
                using var stream = new MemoryStream(bytes);
                await storage.UploadAsync(PosterBucket, posterKey, stream, "image/jpeg");
                Console.WriteLine($"  ✅ Poster uploaded: {PosterBucket}/{posterKey}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"  ⚠️ Could not upload poster: {ex.Message}");
                posterKey = null;
            }
        }
        else
        {
            Console.WriteLine($"  ⚠️ Poster file not found: {posterFile}");
        }

        var ev = new Event
        {
            Title = "AudioVerse Karaoke Night",
            Description = "Welcome to the first AudioVerse karaoke event! Join us for a night of singing, fun, and music.",
            Type = EventType.Event,
            Status = EventStatus.Created,
            Access = EventAccessType.Public,
            Visibility = EventVisibility.Public,
            LocationType = EventLocationType.Virtual,
            LocationName = "AudioVerse Online",
            MaxParticipants = 20,
            WaitingListEnabled = true,
            Poster = posterKey,
            OrganizerId = 1
        };

        db.Events.Add(ev);
        await db.SaveChangesAsync();
        Console.WriteLine($"  ✅ Event seeded: '{ev.Title}' (ID: {ev.Id})");
    }
}
