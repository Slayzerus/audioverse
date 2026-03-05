namespace AudioVerse.Application.Commands.Radio;

/// <summary>Result of accepting a radio station invite.</summary>
public record RadioInviteAcceptResult(int InviteId, int RadioStationId, string StationName, DateTime ValidFrom, DateTime ValidTo);
