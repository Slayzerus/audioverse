namespace AudioVerse.Application.Models.Requests.Social;

/// <summary>Request to add a tag to any entity.</summary>
public record AddTagRequest(string EntityType, int EntityId, int PlayerId, string Tag);
