namespace AudioVerse.Domain.Entities.Audio
{
    /// <summary>Extended info for an artist</summary>
    public class ArtistDetail
    {
        public int Id { get; set; }
        public int ArtistId { get; set; }
        public Artist? Artist { get; set; }
        public string? Bio { get; set; }
        public string? ImageUrl { get; set; }
        public string? Country { get; set; }
    }
}
