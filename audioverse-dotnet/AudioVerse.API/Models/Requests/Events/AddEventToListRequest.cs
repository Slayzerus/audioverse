namespace AudioVerse.API.Models.Requests.Events;

/// <summary>Request to add a single event to a list.</summary>
public record AddEventToListRequest(int EventId, string? Note = null, string? Tags = null);
