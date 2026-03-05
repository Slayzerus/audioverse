namespace AudioVerse.Domain.Entities.Audio
{
    /// <summary>Musical artist</summary>
    public class Artist
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string NormalizedName { get; set; } = string.Empty;
        public ArtistDetail? Detail { get; set; }
        public ICollection<ArtistFact> Facts { get; set; } = new List<ArtistFact>();
    }
}
