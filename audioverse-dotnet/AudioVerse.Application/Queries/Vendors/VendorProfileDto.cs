namespace AudioVerse.Application.Queries.Vendors;

/// <summary>
/// Public vendor profile details DTO.
/// </summary>
public record VendorProfileDto(
    int Id, int OrganizationId, string OrganizationName, string? OrganizationLogo,
    string Slug, string? ShortDescription, string? FullDescription,
    string Category, string? AdditionalCategories,
    string? Phone, string? Email, string? Website, string? CoverImageUrl,
    string? City, string? Region, string? CountryCode, double? Latitude, double? Longitude, int? ServiceRadiusKm,
    double AverageRating, int ReviewCount, bool IsVerified);
