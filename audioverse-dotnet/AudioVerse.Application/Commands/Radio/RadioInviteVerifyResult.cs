namespace AudioVerse.Application.Commands.Radio;

/// <summary>Result of verifying a radio station invite (guest-facing data).</summary>
public record RadioInviteVerifyResult(int InviteId, int RadioStationId, string StationName, string Email, DateTime ValidFrom, DateTime ValidTo, string? Message, string Status);
