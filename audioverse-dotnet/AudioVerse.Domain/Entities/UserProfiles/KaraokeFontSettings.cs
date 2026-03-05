namespace AudioVerse.Domain.Entities.UserProfiles
{
    /// <summary>
    /// Ustawienia czcionki wyświetlanej podczas karaoke (tekst piosenek).
    /// </summary>
    public class KaraokeFontSettings
    {
        /// <summary>Czcionka (null = Arial).</summary>
        public string? FontFamily { get; set; }
        /// <summary>Rozmiar w px.</summary>
        public int FontSize { get; set; } = 18;
        /// <summary>Kolor tekstu (null = auto #fff).</summary>
        public string? FontColor { get; set; }
        /// <summary>Kolor obrysu.</summary>
        public string? OutlineColor { get; set; }
        /// <summary>Grubość obrysu w px.</summary>
        public float OutlineWidth { get; set; }
        /// <summary>CSS text-shadow.</summary>
        public string? Shadow { get; set; }
    }
}
