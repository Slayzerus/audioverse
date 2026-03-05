using AudioVerse.Domain.Diagrams;

namespace AudioVerse.Domain.Entities.Audio
{
    /// <summary>Song — general music catalog entry (NOT karaoke-specific)</summary>
    [DiagramNode("Audio", FillColor = "#dae8fc", StrokeColor = "#6c8ebf", Icon = "??", Description = "Katalog muzyczny")]
    public class Song : ISoftDeletable
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public int? AlbumId { get; set; }
        public Album? Album { get; set; }
        public string? ISRC { get; set; }
        public int? PrimaryArtistId { get; set; }
        public Artist? PrimaryArtist { get; set; }
        public ICollection<SongDetail> Details { get; set; } = new List<SongDetail>();
        public bool IsDeleted { get; set; }
        public DateTime? DeletedAt { get; set; }
        public int? DeletedByUserId { get; set; }
    }
}
