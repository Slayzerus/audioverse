using AudioVerse.Domain.Enums.Events;

namespace AudioVerse.Domain.Entities.Events
{
    public class EventPollOption
    {
        public int Id { get; set; }
        public int PollId { get; set; }
        public string Text { get; set; } = string.Empty;
        public int SortOrder { get; set; }

        // link to source entity when OptionSource != Manual
        public int? SourceEntityId { get; set; }
        public EventPollOptionSource? SourceEntityType { get; set; }
        public decimal? UnitCost { get; set; }
        public string? ImageUrl { get; set; }
    }
}
