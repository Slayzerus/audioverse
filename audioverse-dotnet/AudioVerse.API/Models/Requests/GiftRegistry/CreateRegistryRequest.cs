

namespace AudioVerse.API.Models.Requests.GiftRegistry;

/// <summary>Request to create a new gift registry.</summary>
public record CreateRegistryRequest(string Name, string? Description = null, int? EventId = null);
