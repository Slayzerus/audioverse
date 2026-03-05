using AudioVerse.Domain.Enums.Events;

namespace AudioVerse.Domain.Entities.Events
{
    public class EventAttraction
    {
        public int Id { get; set; }
        public int EventId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public AttractionType Type { get; set; }
        public string? Location { get; set; }
        public int? Capacity { get; set; }
        public bool IsActive { get; set; } = true;
        public string? ImageKey { get; set; }
        public decimal? Price { get; set; }
    }
}
