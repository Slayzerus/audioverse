namespace AudioVerse.Application.Models.Audio
{
    public sealed class SearchSongLinksRequest
    {
        public List<string> Artists { get; set; } = new();
        public List<string> Titles { get; set; } = new();
        /// <summary>Wersja/edycja/feat (np. "Remastered", "feat. XYZ").</summary>
        public string? Version { get; set; }
        /// <summary>Alternatywna fraza wprost. Jeżeli podana – ma pierwszeństwo przed kombinacją pól.</summary>
        public string? Phrase { get; set; }
        /// <summary>Mapa platform z ich opcjami. Kluczem jest enum MusicPlatform (można też użyć All).</summary>
        public Dictionary<MusicPlatform, PlatformSearchOptions> Platforms { get; set; } = new()
        {
            { MusicPlatform.All, new PlatformSearchOptions() }
        };
    }
}
