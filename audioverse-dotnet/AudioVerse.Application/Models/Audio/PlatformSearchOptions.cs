namespace AudioVerse.Application.Models.Audio
{
    public sealed class PlatformSearchOptions
    {
        /// <summary>Przykładowy limit wyników (domyślnie 1 – bierzemy top match).</summary>
        public int Limit { get; set; } = 1;
        /// <summary>Rynek / region (np. "PL").</summary>
        public string? MarketOrCountry { get; set; }
        /// <summary>Dodatkowy suffix/prefix do zapytania (np. "official music video").</summary>
        public string? QueryHint { get; set; }
    }
}
