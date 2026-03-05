namespace AudioVerse.Domain.Entities.UserProfiles
{
    /// <summary>
    /// Ustawienia wizualne karaoke gracza — 4 warianty paska i czcionka.
    /// Przechowywane jako JSON w kolumnie KaraokeSettings encji UserProfilePlayer.
    /// </summary>
    public class KaraokeSettings
    {
        /// <summary>Pasek zaśpiewanych nut.</summary>
        public KaraokeBarFill FilledBar { get; set; } = new();
        /// <summary>Pasek niezaśpiewanych nut.</summary>
        public KaraokeBarFill EmptyBar { get; set; } = new()
        {
            Color = "#d1d5db",
            Glass = 85
        };
        /// <summary>Pasek zaśpiewanych złotych nut.</summary>
        public KaraokeBarFill GoldFilledBar { get; set; } = new()
        {
            PatternName = "Stars"
        };
        /// <summary>Pasek niezaśpiewanych złotych nut.</summary>
        public KaraokeBarFill GoldEmptyBar { get; set; } = new()
        {
            Color = "#b4af9f",
            PatternName = "Stars"
        };
        /// <summary>Ustawienia czcionki tekstu piosenek.</summary>
        public KaraokeFontSettings Font { get; set; } = new();
    }
}
