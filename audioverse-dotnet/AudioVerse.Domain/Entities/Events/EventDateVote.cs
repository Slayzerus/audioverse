using AudioVerse.Domain.Enums.Events;

namespace AudioVerse.Domain.Entities.Events;

/// <summary>
/// A participant's availability vote on a proposed date.
/// </summary>
public class EventDateVote
{
    public int Id { get; set; }
    public int ProposalId { get; set; }
    public EventDateProposal? Proposal { get; set; }

    /// <summary>User who voted.</summary>
    public int UserId { get; set; }

    /// <summary>Availability status for this slot.</summary>
    public DateVoteStatus Status { get; set; }

    /// <summary>Optional comment (e.g. "mogę ale po 18").</summary>
    public string? Comment { get; set; }

    public DateTime VotedAt { get; set; } = DateTime.UtcNow;
}
