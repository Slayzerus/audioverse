using AudioVerse.Domain.Entities.Audio;
using AudioVerse.Domain.Enums.Audio;

namespace AudioVerse.Application.Models.Dtos;

/// <summary>
/// Szczegółowe dane piosenki z katalogu audio (Song + Artist + SongDetail).
/// Zwracane jako zagnieżdżony obiekt w KaraokeSongDto.
/// </summary>
public class LinkedSongInfoDto
{
    public int SongId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? ISRC { get; set; }

    public string? ArtistName { get; set; }
    public string? ArtistImageUrl { get; set; }
    public string? ArtistCountry { get; set; }
    public string? ArtistBio { get; set; }

    public string? AlbumTitle { get; set; }
    public int? AlbumReleaseYear { get; set; }
    public string? AlbumCoverUrl { get; set; }

    public List<SongDetailDto> Details { get; set; } = new();

    /// <summary>Wygodny dostęp do linków streamingowych.</summary>
    public List<string> StreamingLinks { get; set; } = new();

    /// <summary>URL okładki z serwisu zewnętrznego (np. Spotify).</summary>
    public string? ExternalCoverUrl { get; set; }

    /// <summary>Czas trwania w sekundach (jeśli dostępny).</summary>
    public int? DurationSeconds { get; set; }

    public static LinkedSongInfoDto? FromSong(Song? song)
    {
        if (song == null) return null;

        var dto = new LinkedSongInfoDto
        {
            SongId = song.Id,
            Title = song.Title,
            ISRC = song.ISRC,
            ArtistName = song.PrimaryArtist?.Name,
            ArtistImageUrl = song.PrimaryArtist?.Detail?.ImageUrl,
            ArtistCountry = song.PrimaryArtist?.Detail?.Country,
            ArtistBio = song.PrimaryArtist?.Detail?.Bio,
            AlbumTitle = song.Album?.Title,
            AlbumReleaseYear = song.Album?.ReleaseYear,
            AlbumCoverUrl = song.Album?.CoverUrl,
        };

        if (song.Details != null)
        {
            foreach (var d in song.Details)
            {
                dto.Details.Add(new SongDetailDto
                {
                    Type = d.Type.ToString(),
                    Value = d.Value ?? ""
                });

                if (d.Type == SongDetailType.StreamingLinks && !string.IsNullOrEmpty(d.Value))
                {
                    var parts = d.Value.Split('|');
                    foreach (var part in parts)
                    {
                        if (part.StartsWith("http"))
                            dto.StreamingLinks.Add(part);
                    }
                }

                if (d.Type == SongDetailType.Popularity && d.Value != null && d.Value.StartsWith("cover_url:"))
                    dto.ExternalCoverUrl = d.Value["cover_url:".Length..];

                if (d.Type == SongDetailType.Credits && d.Value != null && d.Value.StartsWith("duration_seconds:"))
                {
                    if (int.TryParse(d.Value["duration_seconds:".Length..], out var dur))
                        dto.DurationSeconds = dur;
                }
            }
        }

        return dto;
    }
}
