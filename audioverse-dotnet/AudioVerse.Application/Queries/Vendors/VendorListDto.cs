namespace AudioVerse.Application.Queries.Vendors;

/// <summary>
/// Vendor list item DTO for marketplace browsing, filtering and pagination.
/// </summary>
public record VendorListDto(
    int Id, string Slug, string OrganizationName, string? ShortDescription, string Category,
    string? City, string? Region, string? CountryCode, string? CoverImageUrl,
    double AverageRating, int ReviewCount, bool IsVerified);
