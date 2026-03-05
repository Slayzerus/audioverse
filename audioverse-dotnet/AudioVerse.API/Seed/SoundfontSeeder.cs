using System.Security.Cryptography;
using AudioVerse.Domain.Entities.Audio;
using AudioVerse.Infrastructure.Persistence;
using AudioVerse.Infrastructure.Storage;
using Microsoft.EntityFrameworkCore;

namespace AudioVerse.API.Seed;

/// <summary>
/// Seeds soundfonts from the Seed/Soundfonts folder into the database and MinIO storage.
/// Only runs when the Soundfonts table is empty.
/// </summary>
public static class SoundfontSeeder
{
    private const string Bucket = "soundfonts";

    private static readonly Dictionary<string, SoundfontSeedMeta> KnownSoundfonts = new(StringComparer.OrdinalIgnoreCase)
    {
        ["FluidR3_GM2-2.SF2"] = new("FluidR3 GM2-2", "Frank Wen et al.", "2.2", "MIT", "General MIDI 2 / GS compatible, high-quality orchestral and synth sounds.", "gm,gm2,gs,orchestra,piano,strings,brass,woodwinds,synth,drums", 512),
        ["Creative (emu10k1)8MBGMSFX.SF2"] = new("Creative 8MB GM+SFX", "Creative Labs / E-MU", "1.0", "Freeware", "Classic 8 MB GM soundfont from Creative SoundBlaster Live! / Audigy.", "gm,soundblaster,creative,emu10k1,retro,8mb", 128),
        ["16.5mg_gm_gs_mt32_v2.51_bank.sf2"] = new("16.5 MB GM/GS/MT-32 Bank", "Unknown", "2.51", "Freeware", "Compact GM + GS + MT-32 compatible bank, good for retro MIDI playback.", "gm,gs,mt32,retro,compact", 256),
        ["Jurgen_GM_GS_Bank.sf2"] = new("Jürgen's GM/GS Bank", "Jürgen", "1.0", "Freeware", "Large GM/GS bank with rich instrument samples.", "gm,gs,piano,strings,brass", 256),
        ["Roland_SC-55_v2.2_by_Patch93_and_xan1242.sf2"] = new("Roland SC-55 (Recreation)", "Patch93 & xan1242", "2.2", "Freeware", "Faithful recreation of the iconic Roland Sound Canvas SC-55 module.", "gm,gs,roland,sc-55,retro,soundcanvas", 512),
    };

    public static async Task SeedSoundfontsFromFolder(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AudioVerseDbContext>();
        var storage = scope.ServiceProvider.GetRequiredService<IFileStorage>();

        if (await db.Soundfonts.AnyAsync())
        {
            Console.WriteLine($"🎹 Soundfonts already seeded ({await db.Soundfonts.CountAsync()} entries) — skipping.");
            return;
        }

        var seedFolder = Path.Combine(AppContext.BaseDirectory, "Seed", "Soundfonts");
        if (!Directory.Exists(seedFolder))
        {
            Console.WriteLine($"🎹 Seed/Soundfonts folder not found: {seedFolder}");
            return;
        }

        Console.WriteLine("🎹 Seeding soundfonts from Seed/Soundfonts...");
        await storage.EnsureBucketExistsAsync(Bucket);

        var sf2Files = Directory.GetFiles(seedFolder, "*.sf2", SearchOption.TopDirectoryOnly);

        foreach (var sf2Path in sf2Files)
        {
            var fileName = Path.GetFileName(sf2Path);
            var meta = KnownSoundfonts.GetValueOrDefault(fileName);

            var soundfont = new Soundfont
            {
                Name = meta?.Name ?? Path.GetFileNameWithoutExtension(fileName),
                Description = meta?.Description,
                Format = SoundfontFormat.SF2,
                Author = meta?.Author,
                Version = meta?.Version,
                License = meta?.License,
                PresetCount = meta?.PresetCount,
                Tags = meta?.Tags,
                UploadedByUserId = null,
            };

            db.Soundfonts.Add(soundfont);
            await db.SaveChangesAsync();

            // Upload SF2 file
            await UploadFileAsync(db, storage, soundfont, sf2Path, SoundfontFileType.SoundfontBank);

            // Check for companion files (same base name, different extensions)
            var baseName = Path.GetFileNameWithoutExtension(sf2Path);
            var companions = Directory.GetFiles(seedFolder)
                .Where(f => !f.Equals(sf2Path, StringComparison.OrdinalIgnoreCase) &&
                            Path.GetFileNameWithoutExtension(f).Equals(baseName, StringComparison.OrdinalIgnoreCase))
                .ToList();

            foreach (var companion in companions)
            {
                var ext = Path.GetExtension(companion).ToLowerInvariant();
                var fileType = ext switch
                {
                    ".mp3" or ".ogg" or ".wav" or ".flac" => SoundfontFileType.PreviewAudio,
                    ".png" or ".jpg" or ".jpeg" or ".gif" or ".webp" => SoundfontFileType.Thumbnail,
                    ".txt" or ".md" => SoundfontFileType.Readme,
                    ".license" or ".lic" => SoundfontFileType.License,
                    ".pdf" or ".doc" or ".html" => SoundfontFileType.Documentation,
                    _ => SoundfontFileType.Other
                };

                await UploadFileAsync(db, storage, soundfont, companion, fileType);
            }

            Console.WriteLine($"  ✅ {soundfont.Name} ({soundfont.Files.Count} files, {soundfont.TotalSizeBytes / 1024 / 1024} MB)");
        }

        // Obsługa katalogów soundfontów (np. Dusty Keys Sample Pack)
        var subdirs = Directory.GetDirectories(seedFolder);
        foreach (var dir in subdirs)
        {
            var dirName = Path.GetFileName(dir);
            if (dirName.StartsWith(".")) continue; // pomiń ukryte
            // Sprawdź czy soundfont o tej nazwie już istnieje
            if (await db.Soundfonts.AnyAsync(s => s.Name == dirName))
            {
                Console.WriteLine($"  ⚠️ Pomijam katalog (już istnieje soundfont): {dirName}");
                continue;
            }
            var files = Directory.GetFiles(dir, "*.*", SearchOption.TopDirectoryOnly)
                .Where(f => f.EndsWith(".wav", StringComparison.OrdinalIgnoreCase) ||
                            f.EndsWith(".aiff", StringComparison.OrdinalIgnoreCase) ||
                            f.EndsWith(".flac", StringComparison.OrdinalIgnoreCase) ||
                            f.EndsWith(".mp3", StringComparison.OrdinalIgnoreCase) ||
                            f.EndsWith(".ogg", StringComparison.OrdinalIgnoreCase))
                .ToList();
            if (files.Count == 0) continue;

            var soundfont = new Soundfont
            {
                Name = dirName,
                Description = $"Sample pack: {dirName} (auto-import)",
                Format = SoundfontFormat.Single,
                Author = "Unknown",
                Version = null,
                License = "CC0",
                PresetCount = files.Count,
                Tags = "samplepack,single,samples",
                UploadedByUserId = null,
            };
            db.Soundfonts.Add(soundfont);
            await db.SaveChangesAsync();

            foreach (var file in files)
            {
                var fileName = Path.GetFileName(file);
                // Sprawdź czy plik już jest w bazie dla tego soundfontu
                if (await db.SoundfontFiles.AnyAsync(f => f.FileName == fileName && f.SoundfontId == soundfont.Id))
                {
                    Console.WriteLine($"    ⚠️ Pomijam plik (już istnieje): {fileName}");
                    continue;
                }
                await UploadFileAsync(db, storage, soundfont, file, SoundfontFileType.SoundfontBank);
            }
            Console.WriteLine($"  ✅ {soundfont.Name} (sample pack, {files.Count} files, {soundfont.TotalSizeBytes / 1024 / 1024} MB)");
        }

        Console.WriteLine($"🎹 Soundfont seeding complete: {sf2Files.Length} soundfonts.");
    }

    private static async Task UploadFileAsync(AudioVerseDbContext db, IFileStorage storage, Soundfont soundfont, string filePath, SoundfontFileType fileType)
    {
        var fileName = Path.GetFileName(filePath);
        var key = $"{soundfont.Id}/{Guid.NewGuid():N}_{fileName}";

        var contentType = Path.GetExtension(filePath).ToLowerInvariant() switch
        {
            ".sf2" => "audio/x-soundfont",
            ".mp3" => "audio/mpeg",
            ".ogg" => "audio/ogg",
            ".wav" => "audio/wav",
            ".flac" => "audio/flac",
            ".png" => "image/png",
            ".jpg" or ".jpeg" => "image/jpeg",
            ".gif" => "image/gif",
            ".webp" => "image/webp",
            ".txt" or ".md" => "text/plain",
            ".pdf" => "application/pdf",
            _ => "application/octet-stream"
        };

        await using var stream = File.OpenRead(filePath);

        // SHA-256
        string sha256;
        using (var sha = SHA256.Create())
        {
            var hash = await sha.ComputeHashAsync(stream);
            sha256 = Convert.ToHexStringLower(hash);
        }
        stream.Position = 0;

        await storage.UploadAsync(Bucket, key, stream, contentType);

        var fileInfo = new FileInfo(filePath);
        var sfFile = new SoundfontFile
        {
            SoundfontId = soundfont.Id,
            FileName = fileName,
            StorageKey = key,
            ContentType = contentType,
            SizeBytes = fileInfo.Length,
            FileType = fileType,
            Sha256 = sha256
        };

        db.SoundfontFiles.Add(sfFile);
        soundfont.TotalSizeBytes += fileInfo.Length;
        soundfont.Files.Add(sfFile);
        await db.SaveChangesAsync();
    }

    private record SoundfontSeedMeta(string Name, string Author, string Version, string License, string Description, string Tags, int PresetCount);
}
