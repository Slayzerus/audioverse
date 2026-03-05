namespace AudioVerse.Application.Models.Audio
{
    [Flags]
    public enum MusicPlatform
    {
        None = 0,
        Spotify = 1 << 0,
        Tidal = 1 << 1,
        YouTube = 1 << 2,
        All = Spotify | Tidal | YouTube
    }
}
