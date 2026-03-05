namespace AudioVerse.Domain.Entities.Media
{
    /// <summary>Free-form tag attached to a TV show.</summary>
    public class TvShowTag
    {
        public int Id { get; set; }
        public int TvShowId { get; set; }
        public TvShow? TvShow { get; set; }
        public string Tag { get; set; } = string.Empty;
    }
}
