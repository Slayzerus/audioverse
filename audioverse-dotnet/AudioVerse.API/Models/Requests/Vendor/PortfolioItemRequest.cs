using AudioVerse.Domain.Entities.Vendors;

namespace AudioVerse.API.Models.Requests.Vendor;

/// <summary>Request to add a portfolio item.</summary>
public record PortfolioItemRequest(string? Title, string? Description, string ImageUrl, string? MediaType, int SortOrder = 0);
