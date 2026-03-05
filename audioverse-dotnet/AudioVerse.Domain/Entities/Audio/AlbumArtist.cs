using AudioVerse.Domain.Enums.Audio;

namespace AudioVerse.Domain.Entities.Audio
{
    /// <summary>Join: album ? artist with role</summary>
    public class AlbumArtist
    {
        public int AlbumId { get; set; }
        public Album? Album { get; set; }
        public int ArtistId { get; set; }
        public Artist? Artist { get; set; }
        public AlbumArtistRole Role { get; set; } = AlbumArtistRole.AlbumArtist;
        public int Order { get; set; }
    }
}
