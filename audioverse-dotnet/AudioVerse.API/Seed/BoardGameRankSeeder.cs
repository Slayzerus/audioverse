using System.Globalization;
using AudioVerse.Domain.Entities.Games;
using AudioVerse.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AudioVerse.API.Seed;

public static class BoardGameRankSeeder
{
    public static async Task SeedBoardGameRanksAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AudioVerseDbContext>();

        var csvPath = Path.Combine(AppContext.BaseDirectory, "Seed", "BoardGames", "boardgames_ranks.csv");
        if (!File.Exists(csvPath))
        {
            Console.WriteLine($"⚠️ Nie znaleziono pliku z rankingiem gier planszowych: {csvPath}");
            return;
        }

        var existingIds = await db.BoardGames
            .Where(g => g.BggId != null)
            .Select(g => g.BggId!.Value)
            .ToHashSetAsync();

        var added = 0;
        var skipped = 0;
        var failed = 0;

        await foreach (var game in ReadCsvAsync(csvPath))
        {
            if (existingIds.Contains(game.BggId!.Value))
            {
                skipped++;
                continue;
            }

            db.BoardGames.Add(game);
            existingIds.Add(game.BggId!.Value);
            added++;
        }

        if (added > 0)
            await db.SaveChangesAsync();

        Console.WriteLine($"🎲 BoardGameRankSeeder: dodano {added}, pominięto {skipped}, błędów {failed} (plik: {csvPath})");

        return;

        async IAsyncEnumerable<BoardGame> ReadCsvAsync(string path)
        {
            await using var stream = File.OpenRead(path);
            using var reader = new StreamReader(stream);

            _ = await reader.ReadLineAsync();

            while (!reader.EndOfStream)
            {
                var line = await reader.ReadLineAsync();
                if (string.IsNullOrWhiteSpace(line))
                {
                    continue;
                }

                var columns = SplitCsvLine(line);
                if (columns.Count < 7)
                {
                    failed++;
                    continue;
                }

                if (!int.TryParse(columns[0], out var bggId))
                {
                    failed++;
                    continue;
                }

                var name = columns[1].Trim().Trim('"');
                int? year = null;
                if (int.TryParse(columns[2], out var y))
                    year = y;

                int? rank = null;
                if (int.TryParse(columns[3], out var r))
                    rank = r;

                double? bayes = TryParseDouble(columns[4]);
                double? average = TryParseDouble(columns[5]);
                int? usersRated = int.TryParse(columns[6], out var ur) ? ur : null;

                yield return new BoardGame
                {
                    Name = name,
                    MinPlayers = 0,
                    MaxPlayers = 0,
                    BggId = bggId,
                    BggYearPublished = year,
                    BggRank = rank,
                    BggRating = bayes ?? average,
                    BggUsersRated = usersRated,
                    BggLastSyncUtc = null,
                    IsFullBggData = false
                };
            }
        }

        static List<string> SplitCsvLine(string line)
        {
            var result = new List<string>();
            var current = new System.Text.StringBuilder();
            var inQuotes = false;

            foreach (var ch in line)
            {
                if (ch == '"')
                {
                    inQuotes = !inQuotes;
                    continue;
                }

                if (ch == ',' && !inQuotes)
                {
                    result.Add(current.ToString());
                    current.Clear();
                }
                else
                {
                    current.Append(ch);
                }
            }

            result.Add(current.ToString());
            return result;
        }

        static double? TryParseDouble(string? value)
        {
            if (string.IsNullOrWhiteSpace(value)) return null;
            if (double.TryParse(value, NumberStyles.Float, CultureInfo.InvariantCulture, out var d))
                return d;
            return null;
        }
    }
}
