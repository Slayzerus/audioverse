namespace AudioVerse.Domain.Entities.Events;

/// <summary>
/// Proposed date/time slot for an event. Participants vote on proposals.
/// </summary>
public class EventDateProposal
{
    public int Id { get; set; }
    public int EventId { get; set; }
    public Event? Event { get; set; }

    /// <summary>Proposed start time.</summary>
    public DateTime ProposedStart { get; set; }

    /// <summary>Proposed end time (optional).</summary>
    public DateTime? ProposedEnd { get; set; }

    /// <summary>User who proposed this slot.</summary>
    public int? ProposedByUserId { get; set; }

    /// <summary>Optional note from proposer.</summary>
    public string? Note { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>Votes from participants.</summary>
    public List<EventDateVote> Votes { get; set; } = new();
}
