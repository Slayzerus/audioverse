

namespace AudioVerse.API.Models.Requests.GiftRegistry;

/// <summary>Request to add a gift item to a registry.</summary>
public record GiftItemRequest(string Name, string? Description = null, string? ImageUrl = null,
    string? ExternalUrl = null, decimal? TargetAmount = null, string? Currency = null,
    int? MaxContributors = null, int SortOrder = 0);
