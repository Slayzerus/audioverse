using AudioVerse.Domain.Repositories;
using AudioVerse.Domain.Services;
using AudioVerse.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AudioVerse.API.Seed
{
    public static class SongSeeder
    {
        public static async Task SeedSongsFromFolder(IServiceProvider serviceProvider)
        {
            using var scope = serviceProvider.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<AudioVerseDbContext>();
            var karaokeRepository = scope.ServiceProvider.GetRequiredService<IKaraokeRepository>();

            var songsCount = await dbContext.KaraokeSongs.CountAsync();
            if (songsCount == 0)
            {
                await SeedFromUltrastarFolder(dbContext, karaokeRepository);
            }
            else
            {
                Console.WriteLine($"Baza piosenek zawiera {songsCount} utworow - pomijam seedowanie plikow.");
            }

            // Always match unlinked songs to music catalog (Spotify/YouTube)
            await MatchUnlinkedSongsAsync(scope.ServiceProvider, dbContext);
        }

        private static async Task SeedFromUltrastarFolder(AudioVerseDbContext dbContext, IKaraokeRepository karaokeRepository)
        {
            Console.WriteLine("Rozpoczynam seedowanie piosenek z folderu Seed...");
            var seedFolderPath = Path.Combine(AppContext.BaseDirectory, "Seed", "Ultrastar");

            if (!Directory.Exists(seedFolderPath))
            {
                Console.WriteLine($"Folder Seed nie istnieje: {seedFolderPath}");
                return;
            }

            var txtFiles = Directory.GetFiles(seedFolderPath, "*.txt", SearchOption.TopDirectoryOnly);

            if (txtFiles.Length == 0)
            {
                Console.WriteLine("Nie znaleziono plikow .txt w folderze Seed.");
                return;
            }

            Console.WriteLine($"Znaleziono {txtFiles.Length} plikow .txt do sparsowania.");

            int successCount = 0;
            int failureCount = 0;

            foreach (var filePath in txtFiles)
            {
                try
                {
                    var fileName = Path.GetFileName(filePath);
                    var song = await karaokeRepository.ParseUltrastarSong(filePath);

                    if (song != null)
                    {
                        var songId = await karaokeRepository.AddKaraokeSongFileAsync(song);

                        if (song.Notes != null && song.Notes.Any())
                        {
                            foreach (var note in song.Notes)
                                note.SongId = songId;
                            await dbContext.SaveChangesAsync();
                        }

                        successCount++;
                        Console.WriteLine($"Dodano piosenke: {song.Artist} - {song.Title} (ID: {songId})");
                    }
                    else
                    {
                        failureCount++;
                        Console.WriteLine($"Nie udalo sie sparsowac pliku: {fileName}");
                    }
                }
                catch (Exception ex)
                {
                    failureCount++;
                    Console.WriteLine($"Blad podczas parsowania {Path.GetFileName(filePath)}: {ex.Message}");
                }
            }

            Console.WriteLine($"Seedowanie zakonczone: dodano {successCount}, bledy {failureCount}");
        }

        private static async Task MatchUnlinkedSongsAsync(IServiceProvider services, AudioVerseDbContext dbContext)
        {
            var matcher = services.GetService<ISongMatchingService>();
            if (matcher == null)
                return;

            var unlinked = await dbContext.KaraokeSongs
                .Where(s => s.LinkedSongId == null)
                .ToListAsync();

            if (unlinked.Count == 0)
            {
                Console.WriteLine("Wszystkie piosenki maja juz LinkedSong - pomijam matching.");
                return;
            }

            try
            {
                Console.WriteLine($"Dopasowywanie {unlinked.Count} piosenek do katalogu audio (Spotify/YouTube)...");
                await matcher.MatchAndLinkBatchAsync(unlinked);
                await dbContext.SaveChangesAsync();
                var linked = unlinked.Count(s => s.LinkedSongId.HasValue);
                Console.WriteLine($"Dopasowano {linked}/{unlinked.Count} piosenek do katalogu audio.");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Blad dopasowywania piosenek: {ex.Message}");
            }
        }
    }
}
