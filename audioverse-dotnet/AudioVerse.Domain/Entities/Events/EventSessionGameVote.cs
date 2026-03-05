namespace AudioVerse.Domain.Entities.Events;

/// <summary>
/// A participant's vote/interest in playing a specific game at the event.
/// </summary>
public class EventSessionGameVote
{
    public int Id { get; set; }
    public int PickId { get; set; }
    public EventSessionGamePick? Pick { get; set; }
    public int UserId { get; set; }

    /// <summary>Priority/weight (1 = top choice). Nullable = just a "want to play" flag.</summary>
    public int? Priority { get; set; }

    public DateTime VotedAt { get; set; } = DateTime.UtcNow;
}
