

namespace AudioVerse.API.Models.Requests.Radio;

/// <summary>Request to create a radio invite.</summary>
public record CreateRadioInviteRequest(string Email, DateTime ValidFrom, DateTime ValidTo, string? Message = null);
