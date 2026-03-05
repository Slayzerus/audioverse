namespace AudioVerse.Domain.Entities.Events;

/// <summary>
/// A participant signing up to perform a song. Count of signups
/// determines which songs make it into limited round slots.
/// </summary>
public class EventSessionSongSignup
{
    public int Id { get; set; }
    public int PickId { get; set; }
    public EventSessionSongPick? Pick { get; set; }
    public int UserId { get; set; }

    /// <summary>Optional preferred performance slot/order.</summary>
    public int? PreferredSlot { get; set; }

    public DateTime SignedUpAt { get; set; } = DateTime.UtcNow;
}
