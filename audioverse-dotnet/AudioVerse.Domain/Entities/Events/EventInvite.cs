using AudioVerse.Domain.Enums.Events;

namespace AudioVerse.Domain.Entities.Events
{
    public class EventInvite
    {
        public int Id { get; set; }
        public int? EventId { get; set; }
        public int? FromUserId { get; set; }
        public int? ToUserId { get; set; }
        public string? ToEmail { get; set; }
        public EventInviteStatus Status { get; set; } = EventInviteStatus.Pending;
        public string? Message { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? RespondedAt { get; set; }
    }
}
