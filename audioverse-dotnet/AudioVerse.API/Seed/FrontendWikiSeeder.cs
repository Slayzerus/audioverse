using System.Text.Json;
using AudioVerse.Domain.Entities.Admin;
using AudioVerse.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace AudioVerse.API.Seed;

/// <summary>
/// Seeduje strony wiki frontendowe z plików markdown + manifest JSON
/// z katalogu audioverse-react/docs/wiki/.
/// </summary>
public static class FrontendWikiSeeder
{
    private const string DefaultWikiPath = "../audioverse-react/docs/wiki";
    private const string ManifestFileName = "wiki-seed-manifest.json";

    public static async Task SeedFrontendWikiPages(IServiceProvider services, string? wikiPath = null)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AudioVerseDbContext>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<AudioVerseDbContext>>();

        var basePath = wikiPath ?? DefaultWikiPath;
        var manifestPath = Path.Combine(basePath, ManifestFileName);

        if (!File.Exists(manifestPath))
        {
            logger.LogWarning("Frontend wiki manifest nie znaleziony: {Path} — pomijam seedowanie stron frontendowych", manifestPath);
            return;
        }

        var manifestJson = await File.ReadAllTextAsync(manifestPath);
        var entries = JsonSerializer.Deserialize<List<WikiManifestEntry>>(manifestJson, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        if (entries == null || entries.Count == 0)
        {
            logger.LogWarning("Frontend wiki manifest jest pusty — pomijam");
            return;
        }

        var now = DateTime.UtcNow;
        var seeded = 0;

        foreach (var entry in entries)
        {
            // Sprawdź czy strona o tym slugu już istnieje
            if (await db.WikiPages.AnyAsync(p => p.Slug == entry.Slug))
                continue;

            var mdPath = Path.Combine(basePath, entry.SourceFile);
            if (!File.Exists(mdPath))
            {
                logger.LogWarning("Plik markdown nie znaleziony: {Path} (slug: {Slug}) — pomijam", mdPath, entry.Slug);
                continue;
            }

            var markdown = await File.ReadAllTextAsync(mdPath);

            db.WikiPages.Add(new WikiPage
            {
                Slug = entry.Slug,
                Title = entry.Title,
                Category = entry.Category ?? "Frontend — React",
                SortOrder = entry.SortOrder,
                IsPublished = entry.IsPublished,
                Tags = entry.Tags,
                Icon = entry.Icon,
                ContentMarkdown = markdown,
                CreatedAt = now,
                UpdatedAt = now
            });

            seeded++;
        }

        if (seeded > 0)
        {
            await db.SaveChangesAsync();
            logger.LogInformation("Zaseedowano {Count} stron wiki z frontendu", seeded);
        }
        else
        {
            logger.LogInformation("Wszystkie strony wiki z frontendu już istnieją — pomijam");
        }
    }

    private sealed class WikiManifestEntry
    {
        public string Slug { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string? Category { get; set; }
        public int SortOrder { get; set; }
        public bool IsPublished { get; set; } = true;
        public string? Tags { get; set; }
        public string? Icon { get; set; }
        public string SourceFile { get; set; } = string.Empty;
    }
}
