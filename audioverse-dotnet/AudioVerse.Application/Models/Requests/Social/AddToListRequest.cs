namespace AudioVerse.Application.Models.Requests.Social;

/// <summary>Request to add an entity to a user's personal list.</summary>
public record AddToListRequest(string EntityType, int EntityId, int PlayerId, string ListName, string? Note = null);
