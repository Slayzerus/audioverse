namespace AudioVerse.Domain.Entities.Media
{
    /// <summary>Free-form tag attached to a movie.</summary>
    public class MovieTag
    {
        public int Id { get; set; }
        public int MovieId { get; set; }
        public Movie? Movie { get; set; }
        public string Tag { get; set; } = string.Empty;
    }
}
