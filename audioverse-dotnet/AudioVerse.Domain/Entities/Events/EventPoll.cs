using AudioVerse.Domain.Enums.Events;

namespace AudioVerse.Domain.Entities.Events
{
    public class EventPoll
    {
        public int Id { get; set; }
        public int EventId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public EventPollType Type { get; set; }
        public EventPollOptionSource OptionSource { get; set; }
        public string Token { get; set; } = Guid.NewGuid().ToString("N");
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? ExpiresAt { get; set; }
        public bool IsActive { get; set; } = true;
        public int? CreatedByUserId { get; set; }
        public bool TrackCosts { get; set; }

        public List<EventPollOption> Options { get; set; } = new();
        public List<EventPollResponse> Responses { get; set; } = new();
    }
}
