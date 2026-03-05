using AudioVerse.Domain.Services;
using AudioVerse.Domain.Entities.Audio;
using AudioVerse.Domain.Entities.Karaoke.KaraokeSongFiles;
using AudioVerse.Domain.Enums.Audio;
using AudioVerse.Infrastructure.ExternalApis;
using AudioVerse.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace AudioVerse.Infrastructure.Repositories;

/// <summary>
/// Automatycznie dopasowuje KaraokeSongFile do Song w katalogu audio.
/// Szuka w Spotify (preferowane), potem YouTube. Tworzy Song + Artist jeśli nie istnieją.
/// Zapisuje linki streamingowe i metadane jako SongDetail.
/// </summary>
public class SongMatchingService : ISongMatchingService
{
    private readonly AudioVerseDbContext _db;
    private readonly ISongMetadataClient _metadataClient;
    private readonly ILogger<SongMatchingService> _logger;

    public SongMatchingService(
        AudioVerseDbContext db,
        ISongMetadataClient metadataClient,
        ILogger<SongMatchingService> logger)
    {
        _db = db;
        _metadataClient = metadataClient;
        _logger = logger;
    }

    public async Task MatchAndLinkAsync(KaraokeSongFile karaokeSong, CancellationToken ct)
    {
        if (karaokeSong.LinkedSongId.HasValue)
            return;

        if (string.IsNullOrWhiteSpace(karaokeSong.Title) || string.IsNullOrWhiteSpace(karaokeSong.Artist))
        {
            _logger.LogWarning("Nie można dopasować piosenki karaoke bez tytułu/artysty (Id={Id})", karaokeSong.Id);
            return;
        }

        var searchQuery = $"{karaokeSong.Artist} {karaokeSong.Title}";

        // 1. Szukaj w Spotify (preferowane — lepsza jakość metadanych)
        SongMetadataResult? meta = null;
        try
        {
            meta = await _metadataClient.SearchSpotifyAsync(searchQuery);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Błąd wyszukiwania Spotify dla '{Query}'", searchQuery);
        }

        // 2. Fallback: YouTube
        if (meta == null)
        {
            try
            {
                meta = await _metadataClient.SearchYouTubeAsync(searchQuery);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Błąd wyszukiwania YouTube dla '{Query}'", searchQuery);
            }
        }

        if (meta == null)
        {
            _logger.LogInformation("Nie znaleziono metadanych dla '{Query}'", searchQuery);
            return;
        }

        // 3. Znajdź lub utwórz Artist
        var artistName = !string.IsNullOrWhiteSpace(meta.Artist) ? meta.Artist : karaokeSong.Artist;
        var normalizedArtist = artistName.Trim().ToUpperInvariant();

        var artist = await _db.LibraryArtists
            .FirstOrDefaultAsync(a => a.NormalizedName == normalizedArtist, ct);

        if (artist == null)
        {
            artist = new Artist
            {
                Name = artistName.Trim(),
                NormalizedName = normalizedArtist
            };
            _db.LibraryArtists.Add(artist);
            await _db.SaveChangesAsync(ct);
            _logger.LogInformation("Utworzono artystę '{Artist}' (Id={Id})", artist.Name, artist.Id);
        }

        // 4. Znajdź istniejący Song po ExternalId (Spotify/YouTube) lub Title+Artist
        var existingSong = await FindExistingSongAsync(meta, artist.Id, ct);

        if (existingSong != null)
        {
            karaokeSong.LinkedSongId = existingSong.Id;
            _logger.LogInformation(
                "Zlinkowano karaoke '{Title}' (Id={KaraokeId}) z istniejącym Song (Id={SongId})",
                karaokeSong.Title, karaokeSong.Id, existingSong.Id);
            return;
        }

        // 5. Utwórz nowy Song
        var song = new Song
        {
            Title = !string.IsNullOrWhiteSpace(meta.Title) ? meta.Title : karaokeSong.Title,
            PrimaryArtistId = artist.Id,
        };

        _db.LibrarySongs.Add(song);
        await _db.SaveChangesAsync(ct);

        // 6. Dodaj SongDetail — linki streamingowe i identyfikatory
        var details = new List<SongDetail>();

        if (meta.Source == "Spotify" && !string.IsNullOrEmpty(meta.ExternalId))
        {
            details.Add(new SongDetail
            {
                SongId = song.Id,
                Type = SongDetailType.StreamingLinks,
                Value = $"spotify:track:{meta.ExternalId}|https://open.spotify.com/track/{meta.ExternalId}"
            });
            details.Add(new SongDetail
            {
                SongId = song.Id,
                Type = SongDetailType.Identifiers,
                Value = $"spotify:{meta.ExternalId}"
            });
        }

        if (meta.Source == "YouTube" && !string.IsNullOrEmpty(meta.ExternalId))
        {
            details.Add(new SongDetail
            {
                SongId = song.Id,
                Type = SongDetailType.StreamingLinks,
                Value = $"youtube:{meta.ExternalId}|https://www.youtube.com/watch?v={meta.ExternalId}"
            });
        }

        if (!string.IsNullOrEmpty(meta.CoverUrl))
        {
            details.Add(new SongDetail
            {
                SongId = song.Id,
                Type = SongDetailType.Popularity,
                Value = $"cover_url:{meta.CoverUrl}"
            });
        }

        if (meta.DurationSeconds.HasValue)
        {
            details.Add(new SongDetail
            {
                SongId = song.Id,
                Type = SongDetailType.Credits,
                Value = $"duration_seconds:{meta.DurationSeconds.Value}"
            });
        }

        if (details.Count > 0)
        {
            _db.LibrarySongDetails.AddRange(details);
            await _db.SaveChangesAsync(ct);
        }

        // 7. Uzupełnij brakujące dane na KaraokeSongFile
        if (string.IsNullOrEmpty(karaokeSong.ExternalSource))
        {
            karaokeSong.ExternalSource = meta.Source;
            karaokeSong.ExternalId = meta.ExternalId;
        }

        if (string.IsNullOrEmpty(karaokeSong.ExternalCoverUrl) && !string.IsNullOrEmpty(meta.CoverUrl))
            karaokeSong.ExternalCoverUrl = meta.CoverUrl;

        if (string.IsNullOrEmpty(karaokeSong.Genre) && !string.IsNullOrEmpty(meta.Genre))
            karaokeSong.Genre = meta.Genre;

        if (string.IsNullOrEmpty(karaokeSong.Year) && !string.IsNullOrEmpty(meta.Year))
            karaokeSong.Year = meta.Year;

        karaokeSong.LinkedSongId = song.Id;

        _logger.LogInformation(
            "Utworzono Song (Id={SongId}) i zlinkowano z karaoke '{Title}' (Id={KaraokeId}), źródło: {Source}",
            song.Id, karaokeSong.Title, karaokeSong.Id, meta.Source);
    }

    public async Task MatchAndLinkBatchAsync(IEnumerable<KaraokeSongFile> karaokeSongs, CancellationToken ct)
    {
        foreach (var song in karaokeSongs)
        {
            try
            {
                await MatchAndLinkAsync(song, ct);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Błąd dopasowywania piosenki karaoke '{Title}' (Id={Id})", song.Title, song.Id);
            }
        }
    }

    private async Task<Song?> FindExistingSongAsync(SongMetadataResult meta, int artistId, CancellationToken ct)
    {
        // Szukaj po identyfikatorze zewnętrznym (np. spotify:xxx)
        if (!string.IsNullOrEmpty(meta.ExternalId))
        {
            var identifierValue = $"{meta.Source.ToLowerInvariant()}:{meta.ExternalId}";
            var songIdFromDetail = await _db.LibrarySongDetails
                .Where(d => d.Type == SongDetailType.Identifiers && d.Value == identifierValue)
                .Select(d => d.SongId)
                .FirstOrDefaultAsync(ct);

            if (songIdFromDetail > 0)
                return await _db.LibrarySongs.FindAsync([songIdFromDetail], ct);
        }

        // Szukaj po tytule i artyście
        var titleNormalized = (meta.Title ?? "").Trim().ToUpperInvariant();
        return await _db.LibrarySongs
            .FirstOrDefaultAsync(s =>
                s.PrimaryArtistId == artistId &&
                s.Title.ToUpper() == titleNormalized, ct);
    }
}
