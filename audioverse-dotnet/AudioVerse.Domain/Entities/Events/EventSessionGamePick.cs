namespace AudioVerse.Domain.Entities.Events;

/// <summary>
/// A session-scoped snapshot of a game collection. Created when a collection
/// is assigned to a game session. Participants vote on which games to play.
/// </summary>
public class EventSessionGamePick
{
    public int Id { get; set; }
    public int EventId { get; set; }
    public Event? Event { get; set; }

    /// <summary>Source collection this was cloned from (null if added ad-hoc).</summary>
    public int? SourceCollectionId { get; set; }

    /// <summary>Board game (one of BoardGameId / VideoGameId must be set).</summary>
    public int? BoardGameId { get; set; }

    /// <summary>Video game (one of BoardGameId / VideoGameId must be set).</summary>
    public int? VideoGameId { get; set; }

    /// <summary>Display name snapshot (in case game is deleted later).</summary>
    public string GameName { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>User who proposed this game pick.</summary>
    public int? ProposedByUserId { get; set; }

    /// <summary>Optional notes about why this game was proposed.</summary>
    public string? Notes { get; set; }

    /// <summary>Computed vote count (for carry-over logic).</summary>
    public int VoteCount => Votes?.Count ?? 0;

    public List<EventSessionGameVote> Votes { get; set; } = new();
}
