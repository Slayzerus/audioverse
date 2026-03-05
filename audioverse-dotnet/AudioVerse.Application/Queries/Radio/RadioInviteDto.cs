namespace AudioVerse.Application.Queries.Radio;

/// <summary>Radio station invite DTO (owner listing).</summary>
public record RadioInviteDto(int Id, string Email, string? GuestName, DateTime ValidFrom, DateTime ValidTo, string Status, DateTime CreatedAt, string? Message);
