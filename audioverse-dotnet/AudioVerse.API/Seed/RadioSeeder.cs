using AudioVerse.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AudioVerse.API.Seed;

public static class RadioSeeder
{
    public static async Task SeedRadioBiba(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AudioVerseDbContext>();

        // If station exists, skip
        if (await db.RadioStations.AnyAsync(r => r.Slug == "radio-biba"))
            return;

        var station = new AudioVerse.Domain.Entities.Radio.RadioStation
        {
            Name = "Radio Biba",
            Slug = "radio-biba",
            Description = "Przykładowa stacja seedowa zawierająca piosenki z seeda",
            IsPublic = true,
            CreatedAt = DateTime.UtcNow
        };

        db.RadioStations.Add(station);
        await db.SaveChangesAsync();

        // Create playlist
        var playlist = new AudioVerse.Domain.Entities.Audio.Playlist
        {
            Name = "Radio Biba — Default Playlist",
            Description = "Autogenerowana playlista seedowa",
            Access = AudioVerse.Domain.Entities.Audio.PlaylistAccess.Public,
            Created = DateTime.UtcNow
        };

        db.Playlists.Add(playlist);
        await db.SaveChangesAsync();

        // Attach as default
        station.DefaultPlaylistId = playlist.Id;
        await db.SaveChangesAsync();

        // Fill playlist with first N songs from library
        var songs = await db.LibrarySongs.OrderBy(s => s.Id).Take(20).ToListAsync();
        var order = 1;
        foreach (var s in songs)
        {
            var item = new AudioVerse.Domain.Entities.Audio.PlaylistItem
            {
                PlaylistId = playlist.Id,
                OrderNumber = order++,
                SongId = s.Id,
                IsRequest = false
            };
            db.PlaylistItems.Add(item);
        }

        await db.SaveChangesAsync();
    }
}
