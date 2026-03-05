

namespace AudioVerse.API.Models.Requests.Radio;

/// <summary>Request to accept a radio invite.</summary>
public record AcceptRadioInviteRequest(string? GuestName = null);
