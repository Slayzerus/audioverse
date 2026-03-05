using AudioVerse.Domain.Entities.Audio;
using AudioVerse.Infrastructure.Persistence;
using AudioVerse.Infrastructure.Storage;
using Microsoft.EntityFrameworkCore;

namespace AudioVerse.API.Seed;

/// <summary>
/// Seeder plików audio z folderu Seed/Music — tylko dla admina (OwnerId=1, IsPrivate=true).
/// </summary>
public static class AudioFileSeeder
{
    private const string Bucket = "audio";
    private const int AdminUserId = 1;

    public static async Task SeedAudioFilesFromMusicFolder(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AudioVerseDbContext>();
        var storage = scope.ServiceProvider.GetRequiredService<IFileStorage>();

        if (await db.LibraryAudioFiles.AnyAsync(f => f.OwnerId == AdminUserId && f.IsPrivate))
        {
            Console.WriteLine($"🎵 Prywatne pliki audio admina już istnieją — pomijam seedowanie.");
            return;
        }

        var musicFolder = Path.Combine(AppContext.BaseDirectory, "Seed", "Music");
        if (!Directory.Exists(musicFolder))
        {
            Console.WriteLine($"🎵 Brak folderu Seed/Music: {musicFolder}");
            return;
        }

        Console.WriteLine("🎵 Seedowanie prywatnych plików audio admina z Seed/Music...");
        await storage.EnsureBucketExistsAsync(Bucket);

        var audioFiles = Directory.GetFiles(musicFolder, "*.*", SearchOption.TopDirectoryOnly)
            .Where(f => f.EndsWith(".mp3", StringComparison.OrdinalIgnoreCase) ||
                        f.EndsWith(".wav", StringComparison.OrdinalIgnoreCase) ||
                        f.EndsWith(".ogg", StringComparison.OrdinalIgnoreCase) ||
                        f.EndsWith(".flac", StringComparison.OrdinalIgnoreCase))
            .ToList();

        foreach (var filePath in audioFiles)
        {
            var fileName = Path.GetFileName(filePath);
            // Sprawdź czy już istnieje taki plik admina
            if (await db.LibraryAudioFiles.AnyAsync(f => f.FileName == fileName && f.OwnerId == AdminUserId && f.IsPrivate))
            {
                Console.WriteLine($"  ⚠️ Pomijam (już istnieje): {fileName}");
                continue;
            }
            var key = $"admin/{Guid.NewGuid():N}_{fileName}";
            var ext = Path.GetExtension(fileName).ToLowerInvariant();
            var contentType = ext switch
            {
                ".mp3" => "audio/mpeg",
                ".wav" => "audio/wav",
                ".ogg" => "audio/ogg",
                ".flac" => "audio/flac",
                _ => "application/octet-stream"
            };

            await using var stream = File.OpenRead(filePath);
            await storage.UploadAsync(Bucket, key, stream, contentType);

            var fileInfo = new FileInfo(filePath);
            var audioFile = new AudioFile
            {
                FilePath = key,
                FileName = fileName,
                AudioMimeType = contentType,
                Size = fileInfo.Length,
                OwnerId = AdminUserId,
                IsPrivate = true
            };
            db.LibraryAudioFiles.Add(audioFile);
            Console.WriteLine($"  ✅ {fileName} ({fileInfo.Length / 1024 / 1024} MB)");
        }

        await db.SaveChangesAsync();
        Console.WriteLine($"🎵 Zaseedowano prywatne pliki audio admina (nowe lub brak duplikatów).");

        // Seed publiczne sample z Seed/Samples
        var samplesFolder = Path.Combine(AppContext.BaseDirectory, "Seed", "Samples");
        if (Directory.Exists(samplesFolder))
        {
            var sampleFiles = Directory.GetFiles(samplesFolder, "*.*", SearchOption.TopDirectoryOnly)
                .Where(f => f.EndsWith(".mp3", StringComparison.OrdinalIgnoreCase) ||
                            f.EndsWith(".wav", StringComparison.OrdinalIgnoreCase) ||
                            f.EndsWith(".ogg", StringComparison.OrdinalIgnoreCase) ||
                            f.EndsWith(".flac", StringComparison.OrdinalIgnoreCase))
                .ToList();
            foreach (var filePath in sampleFiles)
            {
                var fileName = Path.GetFileName(filePath);
                // Sprawdź czy już istnieje taki plik publiczny
                if (await db.LibraryAudioFiles.AnyAsync(f => f.FileName == fileName && f.OwnerId == null && !f.IsPrivate))
                {
                    Console.WriteLine($"  ⚠️ Pomijam [public] (już istnieje): {fileName}");
                    continue;
                }
                var key = $"public/{Guid.NewGuid():N}_{fileName}";
                var ext = Path.GetExtension(fileName).ToLowerInvariant();
                var contentType = ext switch
                {
                    ".mp3" => "audio/mpeg",
                    ".wav" => "audio/wav",
                    ".ogg" => "audio/ogg",
                    ".flac" => "audio/flac",
                    _ => "application/octet-stream"
                };
                await using var stream = File.OpenRead(filePath);
                await storage.UploadAsync(Bucket, key, stream, contentType);
                var fileInfo = new FileInfo(filePath);
                var audioFile = new AudioFile
                {
                    FilePath = key,
                    FileName = fileName,
                    AudioMimeType = contentType,
                    Size = fileInfo.Length,
                    OwnerId = null,
                    IsPrivate = false
                };
                db.LibraryAudioFiles.Add(audioFile);
                Console.WriteLine($"  ✅ [public] {fileName} ({fileInfo.Length / 1024 / 1024} MB)");
            }
            await db.SaveChangesAsync();
            Console.WriteLine($"🎵 Zaseedowano publiczne pliki audio (nowe lub brak duplikatów).");
        }
    }
}
