using AudioVerse.Domain.Enums.Events;

namespace AudioVerse.Domain.Entities.Events
{
    public class EventScheduleItem
    {
        public int Id { get; set; }
        public int EventId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime? EndTime { get; set; }
        public ScheduleCategory Category { get; set; }
        public string? Location { get; set; }
        public int SortOrder { get; set; }
    }
}
