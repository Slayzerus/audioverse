namespace AudioVerse.API.Models.Requests.Events;

/// <summary>Request body for adding a user as event participant.</summary>
public class AddParticipantRequest
{
    /// <summary>User ID to add as participant.</summary>
    public int UserId { get; set; }
}
