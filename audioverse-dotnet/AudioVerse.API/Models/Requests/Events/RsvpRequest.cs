namespace AudioVerse.API.Models.Requests.Events;

/// <summary>Request body for RSVP and arrival endpoints.</summary>
public class RsvpRequest
{
    /// <summary>Player ID to register/announce arrival for.</summary>
    public int PlayerId { get; set; }
}
