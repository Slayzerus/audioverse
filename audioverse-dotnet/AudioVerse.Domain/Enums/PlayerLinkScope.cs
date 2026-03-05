namespace AudioVerse.Domain.Enums
{
    /// <summary>
    /// Zakres synchronizacji między zlinkowanymi graczami (flags — można łączyć).
    /// </summary>
    [Flags]
    public enum PlayerLinkScope
    {
        /// <summary>Brak synchronizacji.</summary>
        None = 0,
        /// <summary>Historia śpiewania, wyniki, ranking.</summary>
        Progress = 1,
        /// <summary>Kolory i wzór wizualny (PreferredColors, FillPattern).</summary>
        Appearance = 2,
        /// <summary>Ustawienia pasków karaoke i czcionki.</summary>
        KaraokeSettings = 4,
        /// <summary>Wszystko.</summary>
        All = Progress | Appearance | KaraokeSettings
    }
}
