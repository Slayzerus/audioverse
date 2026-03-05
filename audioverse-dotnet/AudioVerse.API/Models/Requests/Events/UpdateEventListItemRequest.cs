namespace AudioVerse.API.Models.Requests.Events;

/// <summary>Request to update a list item's metadata.</summary>
public record UpdateEventListItemRequest(string? Note = null, string? Tags = null, int SortOrder = 0);
