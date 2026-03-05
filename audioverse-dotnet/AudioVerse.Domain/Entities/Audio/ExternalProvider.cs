namespace AudioVerse.Domain.Entities.Audio
{
    /// <summary>
    /// External music platform provider (Spotify, YouTube, Tidal, etc.).
    /// </summary>
    public enum ExternalProvider
    {
        None = 0,
        YouTube = 10,
        Spotify = 20,
        Tidal = 30,
        Other = 90
    }
}
