using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Entities.UserProfiles;

namespace AudioVerse.Domain.Entities.Games;

/// <summary>
/// A mini-game session — groups multiple rounds played together (e.g. during an event or standalone).
/// </summary>
public class MiniGameSession
{
    public int Id { get; set; }

    /// <summary>Optional event this session belongs to.</summary>
    public int? EventId { get; set; }
    public Event? Event { get; set; }

    /// <summary>User who created / hosted the session.</summary>
    public int? HostPlayerId { get; set; }
    public UserProfilePlayer? HostPlayer { get; set; }

    public DateTime StartedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? EndedAtUtc { get; set; }

    /// <summary>Optional label (e.g. "Friday Night Mini-Games").</summary>
    public string? Title { get; set; }

    public List<MiniGameRound> Rounds { get; set; } = [];
}
