namespace AudioVerse.Domain.Entities.Media
{
    /// <summary>Free-form tag attached to a sport activity.</summary>
    public class SportTag
    {
        public int Id { get; set; }
        public int SportActivityId { get; set; }
        public SportActivity? SportActivity { get; set; }
        public string Tag { get; set; } = string.Empty;
    }
}
