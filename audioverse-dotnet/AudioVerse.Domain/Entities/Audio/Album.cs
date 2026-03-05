namespace AudioVerse.Domain.Entities.Audio
{
    /// <summary>Music album</summary>
    public class Album
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public int? ReleaseYear { get; set; }
        public string? MusicBrainzAlbumId { get; set; }
        public string? MusicBrainzReleaseGroupId { get; set; }
        public string? CoverUrl { get; set; }
        public int? PrimaryArtistId { get; set; }
        public ICollection<AlbumArtist> AlbumArtists { get; set; } = new List<AlbumArtist>();
        public ICollection<Song> Songs { get; set; } = new List<Song>();
    }
}
