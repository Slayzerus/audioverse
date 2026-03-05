namespace AudioVerse.Domain.Entities.Events
{
    public class EventPollResponse
    {
        public int Id { get; set; }
        public int PollId { get; set; }
        public int OptionId { get; set; }
        public EventPollOption? Option { get; set; }
        public string? RespondentEmail { get; set; }
        public int? RespondentUserId { get; set; }
        public int Quantity { get; set; } = 1;
        public DateTime RespondedAt { get; set; } = DateTime.UtcNow;
    }
}
