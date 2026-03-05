

namespace AudioVerse.API.Models.Requests.Radio;

/// <summary>Request to start broadcasting on a radio station.</summary>
public class StartBroadcastRequest
{
    public int? PlaylistId { get; set; }
}
