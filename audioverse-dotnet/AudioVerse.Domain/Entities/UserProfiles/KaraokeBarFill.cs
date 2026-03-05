namespace AudioVerse.Domain.Entities.UserProfiles
{
    /// <summary>
    /// Ustawienia wyglądu paska karaoke (filled/empty/gold).
    /// Definiuje kolor, kształt końcówek, wzór nakładki, efekty 3D i teksturę.
    /// </summary>
    public class KaraokeBarFill
    {
        /// <summary>Kolor bazowy bara (null = auto: kolor gracza dla filled, szary dla empty, złoty dla gold).</summary>
        public string? Color { get; set; }
        /// <summary>Kształt końcówek (Pill, Arrow, Shield, Wave…).</summary>
        public string CapStyleName { get; set; } = "Pill";
        /// <summary>Wzór nakładki (Flames, Scales, Stars…).</summary>
        public string? PatternName { get; set; }
        /// <summary>Kolor wzoru (null = auto).</summary>
        public string? PatternColor { get; set; }
        /// <summary>Tryb bez 3D gloss — sam wzór.</summary>
        public bool PatternOnly { get; set; }
        /// <summary>Intensywność podświetlenia 0–100.</summary>
        public int Highlight { get; set; } = 70;
        /// <summary>Intensywność poświaty 0–100.</summary>
        public int Glow { get; set; } = 55;
        /// <summary>Przezroczystość/szkło 0–100.</summary>
        public int Glass { get; set; }
        /// <summary>URL tekstury kafelkowej.</summary>
        public string? TextureUrl { get; set; }
        /// <summary>Skala tekstury 0.1–2.0.</summary>
        public float TextureScale { get; set; } = 1.0f;
    }
}
