

namespace AudioVerse.API.Models.Requests.GiftRegistry;

/// <summary>Request to contribute to a gift.</summary>
public record ContributionRequest(string? GuestName = null, string? GuestEmail = null,
    decimal? Amount = null, string? Message = null, bool IsAnonymous = false);
