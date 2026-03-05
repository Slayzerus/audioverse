using System.Collections.Generic;

namespace AudioVerse.Application.Models.Requests.Karaoke
{
    public class SongFilterRequest
    {
        public List<string>? Artists { get; set; }
        public List<string>? Genres { get; set; }
        public List<string>? Languages { get; set; }
        public List<int>? Years { get; set; }
        public List<int>? OwnerIds { get; set; }
        public bool? IsVerified { get; set; }
        public bool? InDevelopment { get; set; }
        public string? TitleContains { get; set; }
        public decimal? BpmFrom { get; set; }
        public decimal? BpmTo { get; set; }

        /// <summary>Szukaj w tytule, artyście karaoke ORAZ w danych zlinkowanej piosenki (Artist, Album).</summary>
        public string? SearchQuery { get; set; }

        /// <summary>Filtruj: true = tylko zlinkowane, false = tylko niezlinkowane, null = wszystkie.</summary>
        public bool? HasLinkedSong { get; set; }

        /// <summary>Filtruj po źródle zewnętrznym (np. "Spotify", "YouTube").</summary>
        public string? ExternalSource { get; set; }

        /// <summary>Czas trwania min (w sekundach) — wymaga zlinkowanej piosenki z SongDetail.</summary>
        public int? DurationFromSec { get; set; }

        /// <summary>Czas trwania max (w sekundach).</summary>
        public int? DurationToSec { get; set; }

        /// <summary>Filtruj po nazwie artysty z katalogu audio (LinkedSong.PrimaryArtist.Name).</summary>
        public string? LinkedArtistName { get; set; }

        /// <summary>Filtruj po ISRC z katalogu audio.</summary>
        public string? ISRC { get; set; }

        /// <summary>Czy dołączyć szczegółowe dane zlinkowanej piosenki (domyślnie true).</summary>
        public bool IncludeLinkedSongDetails { get; set; } = true;

        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 50;
        public string? SortBy { get; set; } = "Title"; // Title, Artist, Year, Bpm
        public string? SortDir { get; set; } = "asc"; // asc|desc
    }
}
