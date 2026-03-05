namespace AudioVerse.Application.Models.Audio
{
    public enum MusicPlatformKey
    {
        None = 0,

        // TIDAL
        Tidal = 100,
        TidalAll = 101,          // rezerwujemy na przyszłość (tracks/albums/playlists)
        // Możesz później dodać np. TidalTracks = 102, TidalAlbums = 103, itp.

        // Spotify
        Spotify = 200,
        SpotifyAll = 201,

        // YouTube
        YouTube = 300,
        YouTubeAll = 301,
    }
}
